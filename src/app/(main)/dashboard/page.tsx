import { requireSession } from "@/lib/auth-cache";
import { getCachedDashboardData } from "@/lib/data-cache";
import DashboardClient from "@/components/features/dashboard/DashboardClient";
import BlurFade from "@/components/ui/blur-fade";

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getCachedDashboardData(session.user.id, session.user.name || "Student");

  return (
    <BlurFade delay={0.1} duration={0.4}>
      <DashboardClient
        userName={data.userName}
        documentCount={data.documents.length}
        studyPackCount={data.studyPackCount}
        quizCount={data.quizCount}
        weakAreaCount={data.weakAreaCount}
        currentStreak={data.currentStreak}
        longestStreak={data.longestStreak}
        chartData={data.chartData}
        documents={data.documents}
        studyPackMap={data.studyPackMap}
      />
    </BlurFade>
  );
}
