import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Document from "@/models/Document";
import ClozeQuestion from "@/models/ClozeQuestion";
import { generateClozeSchema } from "@/lib/validations/cloze";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = generateClozeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { studyPackId } = result.data;

    const pack = await StudyPack.findById(studyPackId);
    if (!pack || pack.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Study pack not found" },
        { status: 404 }
      );
    }

    // Gather context
    const topics = await Topic.find({ studyPackId }).lean();
    const doc = await Document.findById(pack.documentId);
    const docText = doc?.rawText?.slice(0, 8000) || "";

    const topicText = topics
      .map((t) => `Topic: ${t.name}\n${t.content}`)
      .join("\n\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `Create 8 fill-in-the-blank questions from the study content provided. For each question, take a key sentence from the material and replace 1-3 important terms with numbered blanks like {{BLANK_1}}, {{BLANK_2}}. The blanks should test understanding of key concepts.

Return ONLY valid JSON array with no extra text:
[{"originalText": "The full original sentence", "blankedText": "The sentence with {{BLANK_1}} replacing key term", "answers": ["key term"], "topicName": "related topic name"}]`,
      messages: [
        {
          role: "user",
          content: `Study material:\n\n${topicText}\n\nDocument excerpt:\n${docText}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Build a topic name -> id map
    const topicMap = new Map<string, string>();
    for (const t of topics) {
      topicMap.set((t.name as string).toLowerCase(), String(t._id));
    }

    // Save to DB
    const saved = await Promise.all(
      questions.map((q: { originalText: string; blankedText: string; answers: string[]; topicName?: string }) => {
        const topicId = q.topicName
          ? topicMap.get(q.topicName.toLowerCase())
          : undefined;
        return ClozeQuestion.create({
          studyPackId,
          originalText: q.originalText,
          blankedText: q.blankedText,
          answers: q.answers,
          topicId: topicId || undefined,
        });
      })
    );

    const serialized = saved.map((q) => ({
      _id: String(q._id),
      originalText: q.originalText,
      blankedText: q.blankedText,
      answers: q.answers,
      blankCount: q.answers.length,
    }));

    return NextResponse.json({ questions: serialized }, { status: 201 });
  } catch (error) {
    console.error("Cloze generate error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
