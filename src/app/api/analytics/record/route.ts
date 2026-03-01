import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ReviewStats from "@/models/ReviewStats";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      cardsReviewed = 0,
      cardsCorrect = 0,
      studyMinutes = 0,
      quizzesTaken = 0,
      quizAvgScore = 0,
      essaysWritten = 0,
    } = body;

    await connectDB();

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert today's ReviewStats
    const updatedStats = await ReviewStats.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          cardsReviewed,
          cardsCorrect,
          studyMinutes,
          quizzesTaken,
          essaysWritten,
        },
        // For quizAvgScore, use $set only if a quiz was taken
        ...(quizzesTaken > 0 ? { $set: { quizAvgScore } } : {}),
      },
      { upsert: true, new: true }
    );

    // Update user streak
    const user = await User.findById(userId);
    if (user) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastReview = user.lastReviewDate
        ? new Date(user.lastReviewDate)
        : null;

      if (lastReview) {
        lastReview.setHours(0, 0, 0, 0);
      }

      const lastReviewTime = lastReview?.getTime();
      const todayTime = today.getTime();
      const yesterdayTime = yesterday.getTime();

      if (lastReviewTime === todayTime) {
        // Already reviewed today, just update minutes
      } else if (lastReviewTime === yesterdayTime) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }

      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }

      user.lastReviewDate = today;
      user.totalStudyMinutes = (user.totalStudyMinutes || 0) + studyMinutes;
      await user.save();
    }

    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error("Analytics record POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
