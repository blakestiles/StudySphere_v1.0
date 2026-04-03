import dynamic from "next/dynamic";
import TextShimmer from "@/components/ui/text-shimmer";

const KnowledgeGraph = dynamic(
  () => import("@/components/features/mind-map/KnowledgeGraph"),
  {
    loading: () => (
      <div className="animate-pulse rounded-2xl border border-border/60 bg-muted/30 h-[600px]" />
    ),
  }
);

export default async function KnowledgeGraphPage() {
  return (
    <div className="space-y-3">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Knowledge Graph</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">Visual connections across all your study topics</p>
      </div>
      <KnowledgeGraph />
    </div>
  );
}
