
import lazyLoad from "next/dynamic";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

const KnowledgeGraph = lazyLoad(
  () => import("@/components/features/mind-map/KnowledgeGraph"),
  { loading: () => (
    <div className="animate-pulse rounded-xl border border-border bg-muted/30 h-[600px]" />
  )}
);

export default async function KnowledgeGraphPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-3">
        <div>
          <TextShimmer className="text-2xl font-bold">Knowledge Graph</TextShimmer>
        </div>
        <KnowledgeGraph />
      </div>
    </BlurFade>
  );
}
