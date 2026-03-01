import AnalyticsDashboard from "@/components/features/analytics/AnalyticsDashboard";

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
