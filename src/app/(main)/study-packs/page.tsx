import { requireSession } from "@/lib/auth-cache";
import { getCachedAllPacks } from "@/lib/data-cache";
import { Plus } from "lucide-react";
import StudyPackShell from "@/components/features/study-packs/StudyPackShell";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function StudyPacksPage() {
  const session = await requireSession();
  const serialized = await getCachedAllPacks(session.user.id);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Study Packs</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">AI-generated packs from your uploaded documents</p>
        </div>
        {serialized.length > 0 && (
          <div className="shrink-0 mt-1">
            <LiquidGlassButton href="/upload">
              <Plus className="h-3.5 w-3.5" />
              New Pack
            </LiquidGlassButton>
          </div>
        )}
      </div>
      <StudyPackShell packs={serialized} />
    </div>
  );
}
