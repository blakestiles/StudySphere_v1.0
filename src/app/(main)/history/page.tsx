import dynamic from "next/dynamic";
import TextShimmer from "@/components/ui/text-shimmer";

const HistoryList = dynamic(
  () => import("@/components/features/history/HistoryList"),
  { loading: () => <div className="animate-pulse h-64 rounded-xl bg-muted/40" /> }
);

export default function HistoryPage() {
  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">History</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">
          Track your learning progress
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
