import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import QuizQuestion from "@/models/QuizQuestion";
import QuizAttempt from "@/models/QuizAttempt";
import { submitQuizSchema } from "@/lib/validations/quiz";

export async function GET(
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

    const studyPack = await StudyPack.findById(id);
    if (!studyPack) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    if (studyPack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const quizQuestions = await QuizQuestion.find({ studyPackId: id });
    return NextResponse.json({ quizQuestions });
  } catch (error) {
    console.error("Get quiz questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const body = await request.json();
    const result = submitQuizSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const studyPack = await StudyPack.findById(id);
    if (!studyPack) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    if (studyPack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { answers } = result.data;

    // Look up all questions
    const questionIds = answers.map((a) => a.questionId);
    const questions = await QuizQuestion.find({ _id: { $in: questionIds }, studyPackId: id });
    const questionMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

    let score = 0;
    const responses = answers.map((a) => {
      const question = questionMap.get(a.questionId);
      const isCorrect = question ? question.correctAnswer === a.selectedAnswer : false;
      if (isCorrect) score++;
      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        questionText: question?.question || "",
        options: question?.options || [],
        correctAnswer: question?.correctAnswer ?? null,
        explanation: question?.explanation || "",
      };
    });

    const attempt = await QuizAttempt.create({
      userId: session.user.id,
      studyPackId: id,
      score,
      totalQuestions: answers.length,
      responses,
    });

    return NextResponse.json({ attempt, score, totalQuestions: answers.length }, { status: 201 });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
