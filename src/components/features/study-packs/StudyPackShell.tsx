"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Search, ArrowRight, FileText,
  Layers, Brain, CheckCircle, Upload
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudyPackItem {
  id: string;
  title: string;
  status: string;
  docTitle: string;
  createdAt: string;
}

// ── Featured (hero) card ───────────────────────────────────
function FeaturedCard({ pack }: { pack: StudyPackItem }) {
  return (
    <Link href={`/study-packs/${pack.id}`} className="block group">
      <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_12px_40px_oklch(0_0_0_/_22%),0_0_0_1px_oklch(0.76_0.17_62_/_12%)]">

        {/* Gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-orange-500/[0.04] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Spotlight */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/0 blur-3xl group-hover:bg-amber-500/10 transition-all duration-700 pointer-events-none" />

        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Icon */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-amber-500/25 blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 border border-amber-500/30 group-hover:border-amber-500/50 transition-all duration-300">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 bg-amber-500/8 border border-amber-500/15 px-2 py-0.5 rounded-md">
                  Most Recent
                </span>
                {pack.status !== "ready" && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                    {pack.status}
                  </Badge>
                )}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-200 leading-snug mb-2">
                {pack.title}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground/60">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{pack.docTitle}</span>
                <span className="text-muted-foreground/30 mx-1">·</span>
                <span className="shrink-0 tabular-nums">{pack.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Action strip */}
          <div className="mt-5 pt-5 border-t border-amber-500/10 flex flex-wrap items-center gap-2">
            {[
              { icon: Layers, label: "Flashcards" },
              { icon: CheckCircle, label: "Quiz" },
              { icon: Brain, label: "Mind Map" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1.5 group-hover:border-amber-500/20 transition-colors">
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-amber-500 group-hover:gap-2.5 transition-all duration-200">
              Open Pack
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Standard card ──────────────────────────────────────────
function PackCard({ pack, index }: { pack: StudyPackItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/study-packs/${pack.id}`} className="block group h-full">
        <div className="relative h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-amber-500/25 hover:shadow-[0_6px_24px_oklch(0_0_0_/_18%),0_0_0_1px_oklch(0.76_0.17_62_/_8%)]">

          {/* Sweep border */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              padding: "1px",
              background: "conic-gradient(from 0deg, transparent 60%, rgba(251,191,36,0.45) 80%, rgba(251,191,36,0.25) 90%, transparent)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-500/0 blur-2xl transition-all duration-500 group-hover:bg-amber-500/8" />

          <div className="relative p-4">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-amber-500/15 blur-md group-hover:blur-lg transition-all duration-300" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/18 to-orange-500/10 border border-amber-500/18 group-hover:border-amber-500/35 transition-all duration-300">
                  <BookOpen className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {pack.status !== "ready" && (
                  <Badge variant="secondary" className="text-[9px] font-medium px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">
                    {pack.status}
                  </Badge>
                )}
                <span className="index-num font-mono">{String(index + 1).padStart(2, "0")}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-display font-semibold text-[14px] leading-snug text-foreground line-clamp-2 mb-2 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-200">
              {pack.title}
            </h3>

            {/* Source doc */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{pack.docTitle}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/40 tabular-nums">{pack.createdAt}</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500/0 group-hover:text-amber-500 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              <span>Open</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main shell ─────────────────────────────────────────────
export default function StudyPackShell({ packs }: { packs: StudyPackItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return packs;
    const q = query.toLowerCase();
    return packs.filter(
      (p) => p.title.toLowerCase().includes(q) || p.docTitle.toLowerCase().includes(q)
    );
  }, [packs, query]);

  const ready = packs.filter((p) => p.status === "ready").length;
  const processing = packs.filter((p) => p.status === "processing").length;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center rounded-2xl border border-dashed border-border/50">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
            <BookOpen className="h-7 w-7 text-amber-500/50" />
          </div>
        </div>
        <h3 className="mb-1.5 font-display text-base font-semibold">No study packs yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
          Upload a document to generate your first AI-powered study pack.
        </p>
        <Link href="/upload">
          <button className="chip-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500/30 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)]">
            <Upload className="h-3.5 w-3.5 text-white/90" />
            Upload Material
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats + Search row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Stats chips */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground/60 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1.5 tabular-nums">
            {packs.length} pack{packs.length !== 1 ? "s" : ""}
          </span>
          {ready > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {ready} ready
            </span>
          )}
          {processing > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {processing} processing
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search packs or documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* No search results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-border/40">
          <p className="text-sm font-medium text-foreground mb-1">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try searching by pack title or document name.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {/* Featured hero card */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <FeaturedCard pack={featured} />
              </motion.div>
            )}

            {/* Rest: grid */}
            {rest.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((pack, i) => (
                  <PackCard key={pack.id} pack={pack} index={i} />
                ))}
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
