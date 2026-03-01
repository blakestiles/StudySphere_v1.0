import { auth } from "@/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import QuizAttempt from "@/models/QuizAttempt";
import FocusSession from "@/models/FocusSession";
import EssayAttempt from "@/models/EssayAttempt";
import Flashcard from "@/models/Flashcard";
import ReviewStats from "@/models/ReviewStats";
import ProfilePage from "@/components/features/profile/ProfilePage";

export default async function ProfileServerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const userId = session.user.id;
  const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

  // Get user's study pack IDs for flashcard lookup
  const userPackIds = await StudyPack.find({ userId }).select("_id").lean();
  const packIds = userPackIds.map((p) => p._id);

  const [user, documentCount, studyPackCount, quizAttempts, focusSessionCount, essayAttempts, flashcards, reviewStatsAgg] =
    await Promise.all([
      User.findById(userId).lean(),
      Document.countDocuments({ userId }),
      StudyPack.countDocuments({ userId }),
      QuizAttempt.find({ userId }).select("score totalQuestions").lean(),
      FocusSession.countDocuments({ userId }),
      EssayAttempt.find({ userId }).select("scores.overall").lean(),
      Flashcard.find({ studyPackId: { $in: packIds } }).select("repetitions lastSeenAt").lean(),
      ReviewStats.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalCardsReviewed: { $sum: "$cardsReviewed" } } },
      ]),
    ]);

  if (!user) redirect("/login");

  // Compute quiz average
  const quizAvg =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum: number, q: { score: number; totalQuestions: number }) => sum + (q.score / q.totalQuestions) * 100, 0) / quizAttempts.length
        )
      : 0;

  // Compute essay average
  const essayAvg =
    essayAttempts.length > 0
      ? Math.round(
          essayAttempts.reduce((sum: number, e: { scores?: { overall?: number } }) => sum + ((e.scores?.overall ?? 0) / 10) * 100, 0) / essayAttempts.length
        )
      : 0;

  // Flashcard mastery breakdown
  const flashcardMastery = { new: 0, learning: 0, mastered: 0, total: flashcards.length };
  for (const card of flashcards) {
    if (card.repetitions === 0 && !card.lastSeenAt) flashcardMastery.new++;
    else if (card.repetitions >= 3) flashcardMastery.mastered++;
    else flashcardMastery.learning++;
  }

  const totalCardsReviewed = reviewStatsAgg[0]?.totalCardsReviewed ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userDoc = user as any;

  return (
    <ProfilePage
      user={{
        name: userDoc.name,
        email: userDoc.email,
        bio: userDoc.bio || "",
        createdAt: userDoc.createdAt
          ? new Date(userDoc.createdAt).toISOString()
          : new Date().toISOString(),
        currentStreak: userDoc.currentStreak ?? 0,
        longestStreak: userDoc.longestStreak ?? 0,
        totalStudyMinutes: userDoc.totalStudyMinutes ?? 0,
      }}
      stats={{
        documentCount,
        studyPackCount,
        quizCount: quizAttempts.length,
        focusSessionCount,
        essayCount: essayAttempts.length,
        quizAvg,
        essayAvg,
        totalCardsReviewed,
        flashcardMastery,
      }}
    />
  );
}
