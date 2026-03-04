import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Document from "@/models/Document";
import { generateExamSchema } from "@/lib/validations/exam";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = generateExamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { studyPackId, difficulty, questionCount, duration } = result.data;

    const pack = await StudyPack.findById(studyPackId);
    if (!pack || pack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    // Build context from topics and document
    const topics = await Topic.find({ studyPackId }).lean();
    const topicText = topics.map((t) => `${t.name}: ${t.content}`).join("\n");

    let docText = "";
    const doc = await Document.findById(pack.documentId);
    if (doc?.rawText) {
      docText = doc.rawText.slice(0, 8000);
    }

    const difficultyInstruction =
      difficulty === "mixed"
        ? "Mix easy, medium, and hard questions roughly equally."
        : `All questions should be ${difficulty} difficulty.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `You are an expert exam question generator. Generate exactly ${questionCount} multiple-choice exam questions based on the provided study material. ${difficultyInstruction}

Return ONLY valid JSON with no extra text, in this exact format:
[
  {
    "questionText": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy"
  }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- difficulty must be "easy", "medium", or "hard"
- Questions should cover different aspects of the material
- Make distractors plausible but clearly incorrect`,
      messages: [
        {
          role: "user",
          content: `Study Pack: ${pack.title}\n\nTopics:\n${topicText}\n\nDocument Content:\n${docText}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse exam questions" },
        { status: 500 }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ questions, duration }, { status: 200 });
  } catch (error) {
    console.error("Exam generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
