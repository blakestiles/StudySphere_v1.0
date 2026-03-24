import dynamic from "next/dynamic";
import TextShimmer from "@/components/ui/text-shimmer";

const AnalyticsDashboard = dynamic(
  () => import("@/components/features/analytics/AnalyticsDashboard"),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-48 rounded-xl bg-muted/40" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-xl bg-muted/30" />
          <div className="h-32 rounded-xl bg-muted/30" />
        </div>
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <TextShimmer className="text-2xl font-bold text-white" duration={4}>Analytics</TextShimmer>
        <p className="text-sm text-muted-foreground">
          Track your study progress and performance
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
