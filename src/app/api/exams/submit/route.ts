import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ExamAttempt from "@/models/ExamAttempt";
import { submitExamSchema } from "@/lib/validations/exam";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = submitExamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { studyPackId, questions, responses, duration, timeTaken, proctored } = result.data;

    // Calculate score
    const score = responses.filter((r) => r.isCorrect).length;

    const attempt = await ExamAttempt.create({
      userId: session.user.id,
      studyPackId,
      questions,
      responses,
      score,
      totalQuestions: questions.length,
      difficulty: "mixed",
      duration,
      timeTaken,
      proctored,
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error("Exam submit error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
