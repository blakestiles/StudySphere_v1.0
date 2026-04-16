import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ClozeQuestion from "@/models/ClozeQuestion";
import StudyPack from "@/models/StudyPack";
import { submitClozeSchema } from "@/lib/validations/cloze";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = submitClozeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    // Pre-fetch user's study pack IDs for ownership validation
    const userPacks = await StudyPack.find({ userId: session.user.id }).select("_id").lean();
    const userPackIds = new Set(userPacks.map((p) => String(p._id)));

    const { questions } = result.data;
    let totalBlanks = 0;
    let correctBlanks = 0;

    const results = await Promise.all(
      questions.map(async (q) => {
        const stored = await ClozeQuestion.findById(q.questionId);
        if (!stored || !userPackIds.has(String(stored.studyPackId))) {
          return { questionId: q.questionId, error: "Not found" };
        }

        const perBlank = stored.answers.map((correct: string, i: number) => {
          const userAnswer = (q.userAnswers[i] || "").trim().toLowerCase();
          const isCorrect = userAnswer === correct.trim().toLowerCase();
          totalBlanks++;
          if (isCorrect) correctBlanks++;
          return {
            blankIndex: i,
            userAnswer: q.userAnswers[i] || "",
            correctAnswer: correct,
            isCorrect,
          };
        });

        return {
          questionId: q.questionId,
          blankedText: stored.blankedText,
          results: perBlank,
        };
      })
    );

    return NextResponse.json({
      totalBlanks,
      correctBlanks,
      score: totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 0,
      questions: results,
    });
  } catch (error) {
    console.error("Cloze submit error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
