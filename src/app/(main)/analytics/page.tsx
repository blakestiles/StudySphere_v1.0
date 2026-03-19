import dynamic from "next/dynamic";

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
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your study progress and performance
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
