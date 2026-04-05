"use client";

import { useEffect, useState } from "react";
import { Store, BookOpen, Users, GitFork, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import TextShimmer from "@/components/ui/text-shimmer";

interface MarketplacePack {
  _id: string;
  title: string;
  shareToken: string;
  summary: string;
  topicCount: number;
  authorName: string;
  isOwnPack: boolean;
  createdAt: string;
}

export default function MarketplacePage() {
  const [packs, setPacks] = useState<MarketplacePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/marketplace")
      .then(r => r.json())
      .then(data => { setPacks(Array.isArray(data) ? data : []); })
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, []);

  const clone = async (packId: string) => {
    setCloning(packId);
    try {
      const res = await fetch(`/api/marketplace/${packId}/clone`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Clone failed"); return; }
      toast.success("Pack cloned to your library!");
    } catch {
      toast.error("Clone failed");
    } finally {
      setCloning(null);
    }
  };

  const filtered = packs.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-md" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                <Store className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Marketplace
            </TextShimmer>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10.5">
            Discover and clone study packs shared by the community
          </p>
        </div>
      </div>

      {/* Search + stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        {!loading && (
          <span className="text-xs font-medium text-muted-foreground/60 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1.5 tabular-nums shrink-0">
            {filtered.length} pack{filtered.length !== 1 ? "s" : ""} available
          </span>
        )}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500/60" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/50">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
              <Store className="h-7 w-7 text-amber-500/50" />
            </div>
          </div>
          <h3 className="mb-1.5 font-display text-base font-semibold text-foreground">
            {search ? `No results for "${search}"` : "No public packs yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {search
              ? "Try a different search term."
              : "Be the first to publish a study pack from your library."}
          </p>
        </div>
      )}

      {/* Pack grid */}
      {!loading && filtered.length > 0 && (
        <AnimatePresence>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pack, index) => (
              <motion.div
                key={pack._id}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="relative h-full rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-amber-500/25 hover:shadow-[0_6px_24px_oklch(0_0_0_/_18%)]">
                  {/* Amber top bar */}
                  <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

                  <div className="p-4 flex flex-col gap-3 h-full">
                    {/* Title + author */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-[14px] leading-snug text-foreground line-clamp-2 flex-1">
                          {pack.title}
                        </h3>
                        {pack.isOwnPack && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/8 rounded-full px-2 py-0.5">
                            Yours
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                        <Users className="w-3 h-3 shrink-0" />
                        <span>{pack.authorName}</span>
                      </div>

                      {pack.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {pack.summary}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {pack.topicCount} topic{pack.topicCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {pack.isOwnPack ? (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 font-medium">
                          Your Pack
                        </span>
                      ) : (
                        <button
                          onClick={() => clone(pack._id)}
                          disabled={cloning === pack._id}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-white rounded-xl px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:shadow-[0_4px_16px_oklch(0.76_0.17_62_/_35%)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {cloning === pack._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <GitFork className="w-3 h-3" />
                          )}
                          Clone
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
