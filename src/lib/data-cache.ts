/**
 * Server-side data cache using Next.js unstable_cache.
 * Results persist between navigations (not just within a single request).
 * Each function is keyed by userId so users never see each other's data.
 *
 * Call revalidateTag(TAGS.xyz(userId)) in mutation API routes to bust the cache.
 */
import { unstable_cache } from "next/cache";
import connectDB from "./db";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import Goal from "@/models/Goal";
import Notebook from "@/models/Notebook";
import WeeklyReport from "@/models/WeeklyReport";
import QuizAttempt from "@/models/QuizAttempt";
import WeakArea from "@/models/WeakArea";
import ReviewStats from "@/models/ReviewStats";
import User from "@/models/User";
import Flashcard from "@/models/Flashcard";
import FocusSession from "@/models/FocusSession";
import EssayAttempt from "@/models/EssayAttempt";
import mongoose from "mongoose";

// Cache TTLs (seconds)
const SHORT = 30;   // frequently-changing data
const MEDIUM = 60;  // stable data (packs, notebooks, docs)

// ─── Cache tags ──────────────────────────────────────────────────────────────
export const TAGS = {
  studyPacks: (uid: string) => `sp:${uid}`,
  documents:  (uid: string) => `doc:${uid}`,
  goals:      (uid: string) => `goal:${uid}`,
  notebooks:  (uid: string) => `nb:${uid}`,
  dashboard:  (uid: string) => `dash:${uid}`,
  reports:    (uid: string) => `wr:${uid}`,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export type SerializedPack    = { _id: string; title: string };
export type SerializedPackFull = { id: string; title: string; status: string; docTitle: string; createdAt: string };
export type SerializedDoc     = { _id: string; title: string; fileType: "pdf" | "text"; status: string; uploadedAt: string };
export type SerializedGoal    = {
  _id: string; title: string; description: string; targetType: string;
  targetValue: number; currentValue: number; deadline: string | undefined;
  status: string; aiSuggestion: string; createdAt: string;
};
export type SerializedNotebook = { _id: string; title: string; studyPackId: string | undefined; updatedAt: string };
export type SerializedReport   = {
  _id: string; weekStart: string; weekEnd: string; summary: string;
  strengths: string[]; weaknesses: string[]; recommendations: string[];
  stats: { studyMinutes: number; quizzesTaken: number; avgScore: number; cardsReviewed: number; essaysWritten: number };
  createdAt: string;
};
export type DashboardData = {
  documents: SerializedDoc[];
  studyPackMap: Record<string, string>;
  studyPackCount: number;
  quizCount: number;
  weakAreaCount: number;
  currentStreak: number;
  longestStreak: number;
  userName: string;
  chartData: { date: string; reviews: number }[];
};

// ─── Ready packs (title only) — used by 7 pages ───────────────────────────────
export function getCachedReadyPacks(userId: string): Promise<SerializedPack[]> {
  return unstable_cache(
    async () => {
      await connectDB();
      const packs = await StudyPack.find({ userId, status: "ready" }).select("title").lean();
      return packs.map(sp => ({ _id: String(sp._id), title: sp.title as string }));
    },
    [`ready-packs:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.studyPacks(userId)] }
  )();
}

// ─── All packs with document title — /study-packs list ────────────────────────
export function getCachedAllPacks(userId: string): Promise<SerializedPackFull[]> {
  return unstable_cache(
    async () => {
      await connectDB();
      const packs = await StudyPack.find({ userId })
        .populate("documentId", "title")
        .sort({ createdAt: -1 })
        .lean();
      return packs.map(sp => {
        const doc = sp.documentId as { title?: string } | null;
        return {
          id: String(sp._id),
          title: sp.title as string,
          status: sp.status as string,
          docTitle: doc && typeof doc === "object" && "title" in doc ? (doc.title || "Unknown document") : "Unknown document",
          createdAt: new Date(sp.createdAt as any).toLocaleDateString(),
        };
      });
    },
    [`all-packs:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.studyPacks(userId)] }
  )();
}

// ─── Documents list — /documents ──────────────────────────────────────────────
export function getCachedDocuments(userId: string): Promise<SerializedDoc[]> {
  return unstable_cache(
    async () => {
      await connectDB();
      const docs = await Document.find({ userId }).sort({ uploadedAt: -1 }).select("-rawText").lean();
      return docs.map(d => ({
        _id: String(d._id),
        title: d.title as string,
        fileType: d.fileType as "pdf" | "text",
        status: d.status as string,
        uploadedAt: new Date(d.uploadedAt as any).toISOString(),
      }));
    },
    [`docs:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.documents(userId)] }
  )();
}

// ─── Dashboard data (6 parallel queries) ─────────────────────────────────────
export function getCachedDashboardData(userId: string, fallbackName: string): Promise<DashboardData> {
  return unstable_cache(
    async () => {
      await connectDB();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [documents, studyPacks, quizCount, weakAreaCount, user, recentStats] = await Promise.all([
        Document.find({ userId }).sort({ uploadedAt: -1 }).limit(5).select("-rawText").lean(),
        StudyPack.find({ userId }).select("documentId title").lean(),
        QuizAttempt.countDocuments({ userId }),
        WeakArea.countDocuments({ userId }),
        User.findById(userId).select("name currentStreak longestStreak").lean(),
        ReviewStats.find({ userId, date: { $gte: sevenDaysAgo } }).sort({ date: 1 }).select("date cardsReviewed").lean(),
      ]);

      const studyPackMap: Record<string, string> = Object.fromEntries(
        studyPacks.map(sp => [String(sp.documentId), String(sp._id)])
      );

      return {
        documents: documents.map(d => ({
          _id: String(d._id),
          title: d.title as string,
          fileType: d.fileType as "pdf" | "text",
          status: d.status as "processing" | "ready" | "error",
          uploadedAt: new Date(d.uploadedAt as any).toISOString(),
        })),
        studyPackMap,
        studyPackCount: studyPacks.length,
        quizCount,
        weakAreaCount,
        currentStreak: (user as any)?.currentStreak || 0,
        longestStreak: (user as any)?.longestStreak || 0,
        userName: (user as any)?.name || fallbackName,
        chartData: (recentStats as any[]).map(s => ({
          date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          reviews: s.cardsReviewed || 0,
        })),
      };
    },
    [`dashboard:${userId}`],
    { revalidate: SHORT, tags: [TAGS.dashboard(userId), TAGS.documents(userId), TAGS.studyPacks(userId)] }
  )();
}

// ─── Goals + ready packs — /goals ─────────────────────────────────────────────
export function getCachedGoalsData(userId: string): Promise<{ goals: SerializedGoal[]; studyPacks: SerializedPack[] }> {
  return unstable_cache(
    async () => {
      await connectDB();
      const [goals, studyPacks] = await Promise.all([
        Goal.find({ userId }).sort({ status: 1, deadline: 1 }).lean(),
        StudyPack.find({ userId, status: "ready" }).select("title").lean(),
      ]);
      return {
        goals: goals.map(g => ({
          _id: String(g._id),
          title: g.title as string,
          description: (g.description as string) || "",
          targetType: g.targetType as string,
          targetValue: g.targetValue as number,
          currentValue: (g.currentValue as number) || 0,
          deadline: g.deadline ? (g.deadline as Date).toISOString() : undefined,
          status: g.status as string,
          aiSuggestion: (g.aiSuggestion as string) || "",
          createdAt: (g.createdAt as Date).toISOString(),
        })),
        studyPacks: studyPacks.map(sp => ({ _id: String(sp._id), title: sp.title as string })),
      };
    },
    [`goals:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.goals(userId), TAGS.studyPacks(userId)] }
  )();
}

// ─── Notebooks + ready packs — /notebooks ─────────────────────────────────────
export function getCachedNotebooksData(userId: string): Promise<{ notebooks: SerializedNotebook[]; studyPacks: SerializedPack[] }> {
  return unstable_cache(
    async () => {
      await connectDB();
      const [notebooks, studyPacks] = await Promise.all([
        Notebook.find({ userId }).sort({ updatedAt: -1 }).lean(),
        StudyPack.find({ userId, status: "ready" }).select("title").lean(),
      ]);
      return {
        notebooks: notebooks.map(n => ({
          _id: String(n._id),
          title: n.title as string,
          studyPackId: n.studyPackId ? String(n.studyPackId) : undefined,
          updatedAt: (n.updatedAt as Date).toISOString(),
        })),
        studyPacks: studyPacks.map(sp => ({ _id: String(sp._id), title: sp.title as string })),
      };
    },
    [`notebooks:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.notebooks(userId), TAGS.studyPacks(userId)] }
  )();
}

// ─── Weekly reports — /weekly-report ─────────────────────────────────────────
export function getCachedWeeklyReports(userId: string): Promise<SerializedReport[]> {
  return unstable_cache(
    async () => {
      await connectDB();
      const reports = await WeeklyReport.find({ userId }).sort({ weekStart: -1 }).limit(12).lean();
      return reports.map(r => ({
        _id: String(r._id),
        weekStart: (r.weekStart as Date).toISOString(),
        weekEnd: (r.weekEnd as Date).toISOString(),
        summary: r.summary as string,
        strengths: r.strengths as string[],
        weaknesses: r.weaknesses as string[],
        recommendations: r.recommendations as string[],
        stats: r.stats as any,
        createdAt: (r.createdAt as Date).toISOString(),
      }));
    },
    [`reports:${userId}`],
    { revalidate: MEDIUM, tags: [TAGS.reports(userId)] }
  )();
}

// ─── Profile stats — /profile ──────────────────────────────────────────────────
export type ProfileData = {
  user: { name: string; email: string; bio: string; createdAt: string; currentStreak: number; longestStreak: number; totalStudyMinutes: number } | null;
  stats: { documentCount: number; studyPackCount: number; quizCount: number; focusSessionCount: number; essayCount: number; quizAvg: number; essayAvg: number; totalCardsReviewed: number; flashcardMastery: { new: number; learning: number; mastered: number; total: number } };
};

export function getCachedProfileData(userId: string): Promise<ProfileData> {
  return unstable_cache(
    async () => {
      await connectDB();
      const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

      const [userPackIds, user, documentCount, quizAttempts, focusSessionCount, essayAttempts, reviewStatsAgg] =
        await Promise.all([
          StudyPack.find({ userId }).select("_id").lean(),
          User.findById(userId).lean(),
          Document.countDocuments({ userId }),
          QuizAttempt.find({ userId }).select("score totalQuestions").lean(),
          FocusSession.countDocuments({ userId }),
          EssayAttempt.find({ userId }).select("scores.overall").lean(),
          ReviewStats.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, totalCardsReviewed: { $sum: "$cardsReviewed" } } },
          ]),
        ]);

      const packIds = userPackIds.map((p) => p._id);
      const flashcards = await Flashcard.find({ studyPackId: { $in: packIds } }).select("repetitions lastSeenAt").lean();

      const quizAvg = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((s: number, q: any) => s + (q.score / q.totalQuestions) * 100, 0) / quizAttempts.length)
        : 0;
      const essayAvg = essayAttempts.length > 0
        ? Math.round(essayAttempts.reduce((s: number, e: any) => s + ((e.scores?.overall ?? 0) / 10) * 100, 0) / essayAttempts.length)
        : 0;

      const flashcardMastery = { new: 0, learning: 0, mastered: 0, total: flashcards.length };
      for (const card of flashcards as any[]) {
        if (card.repetitions === 0 && !card.lastSeenAt) flashcardMastery.new++;
        else if (card.repetitions >= 3) flashcardMastery.mastered++;
        else flashcardMastery.learning++;
      }

      const u = user as any;
      return {
        user: u ? {
          name: u.name, email: u.email, bio: u.bio || "",
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          currentStreak: u.currentStreak ?? 0, longestStreak: u.longestStreak ?? 0,
          totalStudyMinutes: u.totalStudyMinutes ?? 0,
        } : null,
        stats: {
          documentCount, studyPackCount: userPackIds.length,
          quizCount: quizAttempts.length, focusSessionCount,
          essayCount: essayAttempts.length, quizAvg, essayAvg,
          totalCardsReviewed: reviewStatsAgg[0]?.totalCardsReviewed ?? 0,
          flashcardMastery,
        },
      };
    },
    [`profile:${userId}`],
    { revalidate: SHORT, tags: [`profile:${userId}`] }
  )();
}
