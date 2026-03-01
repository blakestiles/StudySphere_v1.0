export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import QuizAttempt from "@/models/QuizAttempt";
import WeakArea from "@/models/WeakArea";
import ReviewStats from "@/models/ReviewStats";
import User from "@/models/User";
import DashboardClient from "@/components/features/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const userId = session.user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [documents, studyPacks, quizCount, weakAreaCount, user, recentStats] =
    await Promise.all([
      Document.find({ userId })
        .sort({ uploadedAt: -1 })
        .limit(5)
        .select("-rawText")
        .lean(),
      StudyPack.find({ userId }).select("documentId title").lean(),
      QuizAttempt.countDocuments({ userId }),
      WeakArea.countDocuments({ userId }),
      User.findById(userId)
        .select("name currentStreak longestStreak")
        .lean(),
      ReviewStats.find({ userId, date: { $gte: sevenDaysAgo } })
        .sort({ date: 1 })
        .select("date cardsReviewed")
        .lean(),
    ]);

  const studyPackMap: Record<string, string> = Object.fromEntries(
    studyPacks.map((sp) => [String(sp.documentId), String(sp._id)])
  );

  const serializedDocs = documents.map((doc) => ({
    _id: String(doc._id),
    title: doc.title as string,
    fileType: doc.fileType as "pdf" | "text",
    status: doc.status as "processing" | "ready" | "error",
    uploadedAt: new Date(doc.uploadedAt).toISOString(),
  }));

  const chartData = (recentStats as any[]).map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    reviews: s.cardsReviewed || 0,
  }));

  const currentStreak = (user as any)?.currentStreak || 0;
  const longestStreak = (user as any)?.longestStreak || 0;
  const userName = (user as any)?.name || session.user.name || "Student";

  return (
    <DashboardClient
      userName={userName}
      documentCount={documents.length}
      studyPackCount={studyPacks.length}
      quizCount={quizCount}
      weakAreaCount={weakAreaCount}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      chartData={chartData}
      documents={serializedDocs}
      studyPackMap={studyPackMap}
    />
  );
}
