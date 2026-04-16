import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Goal from "@/models/Goal";
import Flashcard from "@/models/Flashcard";
import QuizAttempt from "@/models/QuizAttempt";
import FocusSession from "@/models/FocusSession";
import EssayAttempt from "@/models/EssayAttempt";
import StudyPack from "@/models/StudyPack";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const goals = await Goal.find({ userId: session.user.id, status: "active" });
    const userPacks = await StudyPack.find({ userId: session.user.id }).select("_id").lean();
    const packIds = userPacks.map((p) => p._id);

    for (const goal of goals) {
      let currentValue = goal.currentValue;

      switch (goal.targetType) {
        case "flashcards_reviewed": {
          currentValue = await Flashcard.countDocuments({
            studyPackId: { $in: packIds },
            lastSeenAt: { $gte: goal.createdAt },
          });
          break;
        }
        case "quiz_score": {
          const attempts = await QuizAttempt.find({
            userId: session.user.id,
            completedAt: { $gte: goal.createdAt },
          }).lean();
          if (attempts.length > 0) {
            const avgScore =
              attempts.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0), 0) /
              attempts.length;
            currentValue = Math.round(avgScore);
          }
          break;
        }
        case "study_minutes": {
          const sessions = await FocusSession.find({
            userId: session.user.id,
            createdAt: { $gte: goal.createdAt },
          }).lean();
          currentValue = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
          break;
        }
        case "essays_written": {
          currentValue = await EssayAttempt.countDocuments({
            userId: session.user.id,
            completedAt: { $gte: goal.createdAt },
          });
          break;
        }
        case "packs_completed": {
          currentValue = await StudyPack.countDocuments({
            userId: session.user.id,
            status: "ready",
            createdAt: { $gte: goal.createdAt },
          });
          break;
        }
        case "custom":
          // Don't auto-calculate
          break;
      }

      goal.currentValue = currentValue;
      if (currentValue >= goal.targetValue) {
        goal.status = "completed";
      }
      await goal.save();
    }

    const updatedGoals = await Goal.find({ userId: session.user.id })
      .sort({ status: 1, deadline: 1 })
      .lean();

    return NextResponse.json({ goals: updatedGoals });
  } catch (error) {
    console.error("Goals progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
