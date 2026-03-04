export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import WeeklyReport from "@/models/WeeklyReport";
import WeeklyReportView from "@/components/features/reports/WeeklyReportView";

export default async function WeeklyReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const reports = await WeeklyReport.find({ userId: session.user.id })
    .sort({ weekStart: -1 })
    .limit(12)
    .lean();

  const serializedReports = reports.map((r) => ({
    _id: String(r._id),
    weekStart: (r.weekStart as Date).toISOString(),
    weekEnd: (r.weekEnd as Date).toISOString(),
    summary: r.summary as string,
    strengths: r.strengths as string[],
    weaknesses: r.weaknesses as string[],
    recommendations: r.recommendations as string[],
    stats: r.stats as {
      studyMinutes: number;
      quizzesTaken: number;
      avgScore: number;
      cardsReviewed: number;
      essaysWritten: number;
    },
    createdAt: (r.createdAt as Date).toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Weekly Report</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated analysis of your weekly study performance
        </p>
      </div>
      <WeeklyReportView initialReports={serializedReports} />
    </div>
  );
}
