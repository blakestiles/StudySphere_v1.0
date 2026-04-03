import dynamic from "next/dynamic";
import TextShimmer from "@/components/ui/text-shimmer";

const AnalyticsDashboard = dynamic(
  () => import("@/components/features/analytics/AnalyticsDashboard"),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-2xl bg-muted/40" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted/30" />)}
        </div>
        <div className="h-64 rounded-2xl bg-muted/30" />
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Analytics</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">
          Track your study progress and performance
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
