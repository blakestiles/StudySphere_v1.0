import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import CheatSheet from "@/models/CheatSheet";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const studyPack = await StudyPack.findById(id).lean();
    if (!studyPack) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if ((studyPack as any).userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { pages } = await request.json();
    if (!pages || pages < 1 || pages > 4 || !Number.isInteger(pages)) {
      return NextResponse.json({ error: "pages must be an integer between 1 and 4" }, { status: 400 });
    }

    const [topics, flashcards, quizQuestions] = await Promise.all([
      Topic.find({ studyPackId: id }).sort({ order: 1 }).lean(),
      Flashcard.find({ studyPackId: id }).select("question answer").limit(50).lean(),
      QuizQuestion.find({ studyPackId: id }).select("question options correctAnswer").limit(30).lean(),
    ]);

    const contentString = `TOPICS:
${(topics as any[]).map((t) => `## ${t.name}\n${String(t.content || "").slice(0, 300)}`).join("\n\n")}

KEY FLASHCARDS:
${(flashcards as any[]).map((f) => `Q: ${f.question} → A: ${f.answer}`).join("\n")}

QUIZ TRAPS:
${(quizQuestions as any[]).map((q) => `Q: ${q.question} → A: ${(q.options as string[])[q.correctAnswer as number]}`).join("\n")}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: "You are an expert exam preparation assistant.",
      messages: [
        {
          role: "user",
          content: `Create a concise ${pages}-page cheat sheet for the topic "${(studyPack as any).title}".

Each page holds approximately 600 words in a two-column layout.
Total output: approximately ${pages * 600} words maximum.

RULES:
- Use ## headers for each topic section
- Use tight bullet points for key facts and definitions
- Format flashcard pairs as "**Term** — definition"
- Include formulas, mnemonics, and common exam traps
- Abbreviate freely — every word must earn its place
- Output in clean Markdown only — no preamble, no "here is your cheat sheet"

SOURCE MATERIAL:
${contentString}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";

    const saved = await CheatSheet.create({
      userId: session.user.id,
      studyPackId: id,
      title: `${(studyPack as any).title} — ${pages}-page Cheat Sheet`,
      pages,
      content: text,
    });

    return NextResponse.json({ cheatSheet: saved }, { status: 201 });
  } catch (error) {
    console.error("Cheat sheet POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
