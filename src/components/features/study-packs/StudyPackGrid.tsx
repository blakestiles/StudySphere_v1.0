"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowUpRight, FileText } from "lucide-react";

interface StudyPackItem {
  id: string;
  title: string;
  status: string;
  docTitle: string;
  createdAt: string;
}

export default function StudyPackGrid({ packs }: { packs: StudyPackItem[] }) {
  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
            <BookOpen className="h-7 w-7 text-amber-500/50" />
          </div>
        </div>
        <h3 className="mb-1.5 font-display text-base font-semibold text-foreground">No study packs yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">Upload a document to generate your first AI-powered study pack.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((sp, index) => (
        <motion.div
          key={sp.id}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: index * 0.06,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Link href={`/study-packs/${sp.id}`} className="block group h-full">
            <div className="tilt-card grain relative h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-amber-500/25 hover:shadow-[0_8px_32px_oklch(0_0_0_/_20%),0_0_0_1px_oklch(0.76_0.17_62_/_8%)]">

              {/* Sweep border on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  padding: "1px",
                  background: "conic-gradient(from 0deg, transparent 60%, rgba(251,191,36,0.5) 80%, rgba(251,191,36,0.3) 90%, transparent)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              {/* Spotlight glow */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/0 blur-2xl transition-all duration-500 group-hover:bg-amber-500/8" />

              {/* Header strip */}
              <div className="relative px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  {/* Icon with layered depth */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-md group-hover:blur-lg transition-all duration-300" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 group-hover:border-amber-500/35 transition-all duration-300">
                      <BookOpen className="w-4.5 h-4.5 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sp.status !== "ready" && (
                      <Badge
                        variant={sp.status === "error" ? "destructive" : "secondary"}
                        className="text-[10px] font-medium"
                      >
                        {sp.status}
                      </Badge>
                    )}
                    {/* Index */}
                    <span className="index-num font-mono">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold text-[15px] leading-snug text-foreground line-clamp-2 mb-1.5 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-200">
                  {sp.title}
                </h3>

                {/* Source doc */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{sp.docTitle}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

              {/* Footer */}
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/50 tabular-nums">{sp.createdAt}</span>
                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500/0 group-hover:text-amber-500 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                  <span>Open</span>
                  <ArrowUpRight className="w-3 h-3 -translate-y-px group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
