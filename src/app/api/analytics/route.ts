import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import QuizAttempt from "@/models/QuizAttempt";
import FocusSession from "@/models/FocusSession";
import EssayAttempt from "@/models/EssayAttempt";
import Flashcard from "@/models/Flashcard";
import User from "@/models/User";

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Get user's study pack IDs for flashcard query
    const userPacks = await StudyPack.find({ userId }).select("_id");
    const packIds = userPacks.map((p: any) => p._id);

    const [
      docCount,
      packCount,
      quizCount,
      focusCount,
      essayCount,
      user,
      allEssays,
      flashcards,
      allQuizAttempts,
      allFocusSessions,
      recentFlashcards,
    ] = await Promise.all([
      Document.countDocuments({ userId }),
      StudyPack.countDocuments({ userId }),
      QuizAttempt.countDocuments({ userId }),
      FocusSession.countDocuments({ userId, completedAt: { $ne: null } }),
      EssayAttempt.countDocuments({ userId }),
      User.findById(userId).select(
        "currentStreak longestStreak totalStudyMinutes lastReviewDate"
      ),
      EssayAttempt.find({ userId })
        .select("scores.overall completedAt")
        .sort({ completedAt: 1 })
        .lean(),
      Flashcard.find({ studyPackId: { $in: packIds } })
        .select("repetitions lastSeenAt")
        .lean(),
      QuizAttempt.find({ userId })
        .select("score totalQuestions completedAt")
        .sort({ completedAt: 1 })
        .lean(),
      FocusSession.find({ userId, completedAt: { $ne: null } })
        .select("duration completedAt")
        .sort({ completedAt: 1 })
        .lean(),
      // Flashcards reviewed in last 14 days
      Flashcard.find({
        studyPackId: { $in: packIds },
        lastSeenAt: { $gte: fourteenDaysAgo },
      })
        .select("lastSeenAt")
        .lean(),
    ]);

    // ── Build daily activity from real data (last 14 days) ──

    // Initialize all 14 days
    const dailyActivity: Record<string, { reviews: number; quizzes: number; essays: number; focusMins: number }> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      dailyActivity[toDateKey(d)] = { reviews: 0, quizzes: 0, essays: 0, focusMins: 0 };
    }

    // Count flashcard reviews per day
    for (const fc of recentFlashcards as any[]) {
      if (fc.lastSeenAt) {
        const key = toDateKey(new Date(fc.lastSeenAt));
        if (dailyActivity[key]) dailyActivity[key].reviews++;
      }
    }

    // Count quiz attempts per day
    for (const q of allQuizAttempts as any[]) {
      if (q.completedAt) {
        const key = toDateKey(new Date(q.completedAt));
        if (dailyActivity[key]) dailyActivity[key].quizzes++;
      }
    }

    // Count essays per day
    for (const e of allEssays as any[]) {
      if (e.completedAt) {
        const key = toDateKey(new Date(e.completedAt));
        if (dailyActivity[key]) dailyActivity[key].essays++;
      }
    }

    // Count focus minutes per day
    for (const f of allFocusSessions as any[]) {
      if (f.completedAt) {
        const key = toDateKey(new Date(f.completedAt));
        if (dailyActivity[key]) dailyActivity[key].focusMins += f.duration || 0;
      }
    }

    // Convert to sorted array
    const dailyActivityArray = Object.entries(dailyActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        reviews: data.reviews,
        quizzes: data.quizzes,
        essays: data.essays,
        focusMins: data.focusMins,
        total: data.reviews + data.quizzes + data.essays,
      }));

    // ── Quiz scores directly from QuizAttempt ──

    const quizScores = (allQuizAttempts as any[]).map((q) => ({
      date: q.completedAt,
      score: q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0,
      correct: q.score,
      total: q.totalQuestions,
    }));

    // ── Essay scores ──

    const essayScores = (allEssays as any[]).map((e) => ({
      date: e.completedAt,
      score: e.scores?.overall ?? 0,
    }));

    const avgEssayScore =
      essayScores.length > 0
        ? essayScores.reduce((sum, e) => sum + e.score, 0) / essayScores.length
        : 0;

    // ── Flashcard mastery breakdown ──

    let newCards = 0;
    let learning = 0;
    let mastered = 0;
    for (const fc of flashcards as any[]) {
      const reps = fc.repetitions ?? 0;
      if (reps === 0) newCards++;
      else if (reps < 3) learning++;
      else mastered++;
    }

    // ── Total study minutes ──

    const focusMinutes = (allFocusSessions as any[]).reduce(
      (sum, f) => sum + (f.duration || 0),
      0
    );
    const totalStudyMinutes = Math.max(
      user?.totalStudyMinutes ?? 0,
      focusMinutes
    );

    // Total cards reviewed (all time from flashcard data)
    const totalCardsReviewed = (flashcards as any[]).filter(
      (fc) => fc.lastSeenAt != null
    ).length;

    return NextResponse.json({
      dailyActivity: dailyActivityArray,
      totals: {
        documents: docCount,
        studyPacks: packCount,
        quizzes: quizCount,
        focusSessions: focusCount,
        essays: essayCount,
        cardsReviewed: totalCardsReviewed,
      },
      streak: {
        current: user?.currentStreak ?? 0,
        longest: user?.longestStreak ?? 0,
        totalStudyMinutes,
        lastReviewDate: user?.lastReviewDate ?? null,
      },
      quizScores,
      essayScores,
      avgEssayScore: Math.round(avgEssayScore * 10) / 10,
      flashcardMastery: {
        new: newCards,
        learning,
        mastered,
        total: (flashcards as any[]).length,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
