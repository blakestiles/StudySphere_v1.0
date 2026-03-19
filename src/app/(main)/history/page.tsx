import dynamic from "next/dynamic";
const HistoryList = dynamic(
  () => import("@/components/features/history/HistoryList"),
  { loading: () => <div className="animate-pulse h-64 rounded-xl bg-muted/40" /> }
);

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">
          Track your learning progress
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
