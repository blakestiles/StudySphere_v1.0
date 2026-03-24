import { requireSession } from "@/lib/auth-cache";
import { getCachedAllPacks } from "@/lib/data-cache";
import { BookOpen, Plus } from "lucide-react";
import StudyPackGrid from "@/components/features/study-packs/StudyPackGrid";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { SparklesText } from "@/components/ui/sparkles-text";
import ShimmerButton from "@/components/ui/shimmer-button";

export default async function StudyPacksPage() {
  const session = await requireSession();
  const serialized = await getCachedAllPacks(session.user.id);

  if (serialized.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Study Packs</h1>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-7 h-7 text-amber-500" />
          </div>
          <SparklesText text="No Study Packs Yet" className="text-xl font-semibold text-white/70 mb-2" />
          <p className="text-sm text-muted-foreground/70 mb-4">Upload a document to generate your first AI study pack</p>
          <LiquidGlassButton href="/upload">
            Upload Material
          </LiquidGlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Study Packs</h1>
        <LiquidGlassButton href="/upload">
          <Plus className="h-3.5 w-3.5" />
          New Pack
        </LiquidGlassButton>
      </div>
      <StudyPackGrid packs={serialized} />
    </div>
  );
}
