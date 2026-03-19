export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import lazyLoad from "next/dynamic";

const KnowledgeGraph = lazyLoad(
  () => import("@/components/features/mind-map/KnowledgeGraph"),
  { loading: () => (
    <div className="animate-pulse rounded-xl border border-border bg-muted/30 h-[600px]" />
  )}
);

export default async function KnowledgeGraphPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground">
          Visualize connections between topics across all your study packs. Search, filter, and explore relationships.
        </p>
      </div>
      <KnowledgeGraph />
    </div>
  );
}
