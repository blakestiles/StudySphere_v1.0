
import { requireSession } from "@/lib/auth-cache";
import { getCachedWeeklyReports } from "@/lib/data-cache";
import WeeklyReportView from "@/components/features/reports/WeeklyReportView";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function WeeklyReportPage() {
  const session = await requireSession();
  const serializedReports = await getCachedWeeklyReports(session.user.id);

  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="text-2xl font-bold">AI Weekly Report</TextShimmer>
        </div>
        <WeeklyReportView initialReports={serializedReports} />
      </div>
    </BlurFade>
  );
}
