import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import EssayAttempt from "@/models/EssayAttempt";
import { gradeEssaySchema } from "@/lib/validations/essay";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`essay-grade:${session.user.id}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before grading again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const result = gradeEssaySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { studyPackId, question, essayText } = result.data;
    const wordCount = essayText.trim().split(/\s+/).length;

    // Build context from study pack if provided
    let contextText = "";
    if (studyPackId) {
      const pack = await StudyPack.findById(studyPackId);
      if (pack && pack.userId.toString() === session.user.id) {
        const doc = await Document.findById(pack.documentId);
        if (doc?.rawText) {
          contextText = doc.rawText.slice(0, 6000);
        }
      }
    }

    const contextSection = contextText
      ? `\n\nReference material for grading accuracy:\n${contextText}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are an expert academic essay grader. Grade the following essay on 4 criteria, each scored 0-10:
- Accuracy: factual correctness and relevance to the question
- Depth: thoroughness and detail of coverage
- Clarity: organization, writing quality, and coherence
- Critical Thinking: analysis beyond surface level, original insights

Return ONLY valid JSON with no extra text, in this exact format:
{
  "scores": { "accuracy": 8, "depth": 7, "clarity": 9, "criticalThinking": 6 },
  "feedback": {
    "perCriteria": { "accuracy": "...", "depth": "...", "clarity": "...", "criticalThinking": "..." },
    "missedPoints": ["point 1", "point 2"],
    "improvements": ["suggestion 1", "suggestion 2"],
    "summary": "Overall assessment paragraph"
  }
}`,
      messages: [
        {
          role: "user",
          content: `Question/Prompt: ${question}\n\nEssay (${wordCount} words):\n${essayText}${contextSection}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse grading response" },
        { status: 500 }
      );
    }

    const grading = JSON.parse(jsonMatch[0]);

    const overall =
      Math.round(
        ((grading.scores.accuracy +
          grading.scores.depth +
          grading.scores.clarity +
          grading.scores.criticalThinking) /
          4) *
          10
      ) / 10;

    const attempt = await EssayAttempt.create({
      userId: session.user.id,
      studyPackId: studyPackId || undefined,
      question,
      essayText,
      wordCount,
      scores: {
        accuracy: grading.scores.accuracy,
        depth: grading.scores.depth,
        clarity: grading.scores.clarity,
        criticalThinking: grading.scores.criticalThinking,
        overall,
      },
      feedback: {
        perCriteria: grading.feedback.perCriteria,
        missedPoints: grading.feedback.missedPoints || [],
        improvements: grading.feedback.improvements || [],
        summary: grading.feedback.summary || "",
      },
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error("Essay grading error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
