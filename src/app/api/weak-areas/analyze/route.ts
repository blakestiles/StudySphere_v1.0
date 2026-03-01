import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import QuizAttempt from "@/models/QuizAttempt";
import QuizQuestion from "@/models/QuizQuestion";
import WeakArea from "@/models/WeakArea";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await request.json();
    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    await connectDB();

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Quiz attempt not found" }, { status: 404 });
    }

    if (attempt.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get wrong answers
    const wrongResponses = attempt.responses.filter((r: any) => !r.isCorrect);
    if (wrongResponses.length === 0) {
      return NextResponse.json({ weakAreas: [], message: "No wrong answers" });
    }

    // Look up questions to get topicIds
    const wrongQuestionIds = wrongResponses.map((r: any) => r.questionId);
    const questions = await QuizQuestion.find({ _id: { $in: wrongQuestionIds } });

    // Group by topicId
    const topicWrongCounts = new Map<string, number>();
    const topicTotalCounts = new Map<string, number>();

    // Count total questions per topic in the attempt
    const allQuestionIds = attempt.responses.map((r: any) => r.questionId);
    const allQuestions = await QuizQuestion.find({ _id: { $in: allQuestionIds } });

    for (const q of allQuestions) {
      if (q.topicId) {
        const topicKey = q.topicId.toString();
        topicTotalCounts.set(topicKey, (topicTotalCounts.get(topicKey) || 0) + 1);
      }
    }

    for (const q of questions) {
      if (q.topicId) {
        const topicKey = q.topicId.toString();
        topicWrongCounts.set(topicKey, (topicWrongCounts.get(topicKey) || 0) + 1);
      }
    }

    // Upsert weak areas
    const upsertPromises = Array.from(topicWrongCounts.entries()).map(([topicId, wrongCount]) => {
      const total = topicTotalCounts.get(topicId) || 1;
      const wrongPercent = wrongCount / total;

      let severity: "low" | "medium" | "high";
      if (wrongPercent > 0.66) {
        severity = "high";
      } else if (wrongPercent > 0.33) {
        severity = "medium";
      } else {
        severity = "low";
      }

      return WeakArea.findOneAndUpdate(
        { userId: session.user.id, topicId },
        { severity, lastUpdated: new Date() },
        { upsert: true, returnDocument: "after" }
      );
    });

    const weakAreas = await Promise.all(upsertPromises);

    return NextResponse.json({ weakAreas });
  } catch (error) {
    console.error("Analyze weak areas error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
