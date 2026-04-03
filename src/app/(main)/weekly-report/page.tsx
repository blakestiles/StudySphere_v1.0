import { requireSession } from "@/lib/auth-cache";
import { getCachedWeeklyReports } from "@/lib/data-cache";
import WeeklyReportView from "@/components/features/reports/WeeklyReportView";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function WeeklyReportPage() {
  const session = await requireSession();
  const serializedReports = await getCachedWeeklyReports(session.user.id);

  return (
    <div className="space-y-4">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">AI Weekly Report</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">AI-generated analysis of your weekly study performance</p>
      </div>
      <WeeklyReportView initialReports={serializedReports} />
    </div>
  );
}
