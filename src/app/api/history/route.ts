import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import QuizAttempt from "@/models/QuizAttempt";
import QuizQuestion from "@/models/QuizQuestion";
import EssayAttempt from "@/models/EssayAttempt";
import FocusSession from "@/models/FocusSession";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    const [quizAttempts, essayAttempts, focusSessions] = await Promise.all([
      QuizAttempt.find({ userId })
        .sort({ completedAt: -1 })
        .limit(50)
        .populate("studyPackId", "title")
        .lean(),
      EssayAttempt.find({ userId })
        .sort({ completedAt: -1 })
        .limit(50)
        .populate("studyPackId", "title")
        .lean(),
      FocusSession.find({ userId, completedAt: { $ne: null } })
        .sort({ completedAt: -1 })
        .limit(50)
        .populate("studyPackId", "title")
        .lean(),
    ]);

    // Collect all questionIds from quiz attempts for batch population
    const questionIds = new Set<string>();
    for (const q of quizAttempts) {
      const qa = q as Record<string, any>;
      if (qa.responses) {
        for (const r of qa.responses) {
          if (r.questionId) questionIds.add(r.questionId.toString());
        }
      }
    }

    // Batch fetch all quiz questions
    const questions = await QuizQuestion.find({
      _id: { $in: Array.from(questionIds) },
    })
      .select("question options correctAnswer explanation")
      .lean();

    const questionMap = new Map<string, any>();
    for (const q of questions) {
      questionMap.set((q as any)._id.toString(), q);
    }

    // Build unified activities
    const activities = [
      ...quizAttempts.map((q: Record<string, any>) => ({
        _id: q._id.toString(),
        type: "quiz" as const,
        title: q.studyPackId?.title || "Unknown Pack",
        date: q.completedAt,
        score: q.score,
        totalQuestions: q.totalQuestions,
        responses: (q.responses || []).map((r: any) => {
          const question = r.questionId
            ? questionMap.get(r.questionId.toString())
            : null;
          return {
            questionId: r.questionId?.toString(),
            selectedAnswer: r.selectedAnswer,
            isCorrect: r.isCorrect,
            questionText: question?.question || null,
            options: question?.options || [],
            correctAnswer: question?.correctAnswer ?? null,
            explanation: question?.explanation || null,
          };
        }),
      })),
      ...essayAttempts.map((e: Record<string, any>) => ({
        _id: e._id.toString(),
        type: "essay" as const,
        title: e.studyPackId?.title || "Practice Essay",
        date: e.completedAt,
        question: e.question,
        essayText: e.essayText,
        scores: e.scores,
        feedback: e.feedback,
        wordCount: e.wordCount,
      })),
      ...focusSessions.map((f: Record<string, any>) => ({
        _id: f._id.toString(),
        type: "focus" as const,
        title: f.studyPackId?.title || "Focus Session",
        date: f.completedAt,
        duration: f.duration,
        goals: f.goals || [],
        completedGoals: f.completedGoals || [],
        recap: f.recap,
        sessionsCompleted: f.sessionsCompleted || 0,
        workDuration: f.workDuration || 25,
      })),
    ];

    activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(activities.slice(0, 50));
  } catch (error) {
    console.error("History GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
