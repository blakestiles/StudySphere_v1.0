"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowUpRight } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <BookOpen className="h-8 w-8 text-orange-400/60" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No study packs yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Upload a document to generate your first AI-powered study pack.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((sp, index) => (
        <motion.div
          key={sp.id}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: index * 0.05,
            duration: 0.4,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          <Link href={`/study-packs/${sp.id}`} className="block group">
              <div className="h-full rounded-2xl border border-border/60 bg-card p-5 hover:border-orange-500/20 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 relative overflow-hidden">
                {/* Hover glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/0 group-hover:bg-amber-500/[0.04] rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/8 border border-amber-500/12 flex items-center justify-center shrink-0 group-hover:bg-amber-500/12 group-hover:scale-105 transition-all duration-300">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                  </div>
                  <Badge
                    variant={
                      sp.status === "ready"
                        ? "default"
                        : sp.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                    className="shrink-0 text-[10px] font-medium"
                  >
                    {sp.status}
                  </Badge>
                </div>

                <h3 className="font-display font-semibold text-[15px] text-foreground line-clamp-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {sp.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{sp.docTitle}</p>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground/60">{sp.createdAt}</p>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-amber-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
