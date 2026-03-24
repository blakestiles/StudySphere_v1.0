"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Upload,
  Brain,
  Layers,
  BarChart3,
  Timer,
  Map,
  StickyNote,
  Trophy,
  Sparkles,
  Zap,
  Target,
  FileText,
  Bell,
  Clock,
} from "lucide-react";

const navItems = [
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: Upload, label: "Upload" },
  { icon: Layers, label: "Study Packs" },
  { icon: Brain, label: "AI Tutor" },
  { icon: Timer, label: "Focus" },
  { icon: Map, label: "Mind Maps" },
  { icon: StickyNote, label: "Notes" },
  { icon: Trophy, label: "Goals" },
];

const studyPacks = [
  { title: "Organic Chemistry", cards: 48, score: 82, color: "bg-amber-500/20 border-amber-500/30" },
  { title: "Cell Biology", cards: 36, score: 91, color: "bg-emerald-500/20 border-emerald-500/30" },
  { title: "Calculus II", cards: 29, score: 74, color: "bg-violet-500/20 border-violet-500/30" },
];

const stats = [
  { value: "247", label: "Cards reviewed", icon: Layers, color: "text-amber-400" },
  { value: "4h 12m", label: "Study time", icon: Clock, color: "text-emerald-400" },
  { value: "87%", label: "Quiz accuracy", icon: Target, color: "text-violet-400" },
  { value: "12", label: "Day streak", icon: Zap, color: "text-rose-400" },
];

interface BrowserMockupProps {
  className?: string;
}

export function BrowserMockup({ className }: BrowserMockupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full max-w-2xl mx-auto select-none", className)}
    >
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-b from-amber-500/[0.05] via-transparent to-violet-500/[0.03] rounded-3xl blur-2xl pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative rounded-t-2xl border border-white/[0.07] bg-[#0d0d1a] px-4 pt-3 pb-0">
        <div className="flex items-center gap-3 mb-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          {/* URL bar */}
          <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.05] px-3 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
            <span className="text-[11px] text-white/25 font-mono tracking-wide">studysphere.app/dashboard</span>
          </div>
          {/* Nav controls */}
          <div className="flex gap-2 shrink-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-md bg-white/[0.04] border border-white/[0.05]" />
            ))}
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 -mb-px">
          <div className="rounded-t-lg border border-b-0 border-white/[0.07] bg-[#08080F] px-4 py-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-white/60">StudySphere</span>
          </div>
          <div className="rounded-t-lg border border-b-0 border-white/[0.03] bg-transparent px-4 py-2">
            <span className="text-[11px] text-white/20">New Tab</span>
          </div>
        </div>
      </div>

      {/* Browser content */}
      <div className="rounded-b-2xl border border-t-0 border-white/[0.07] bg-[#08080F] overflow-hidden">
        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="w-44 shrink-0 border-r border-white/[0.05] bg-[#06060E] p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-white/80 font-display">StudySphere</span>
            </div>
            {navItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors",
                  item.active
                    ? "bg-amber-500/10 text-amber-400 font-medium"
                    : "text-white/25"
                )}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-white/90 font-display">Good morning, Alex</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Ready to study? You have 3 active packs.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center">
                  <Bell className="w-3 h-3 text-white/30" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/40 to-orange-500/40 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">A</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center"
                >
                  <stat.icon className={cn("w-3 h-3 mx-auto mb-1", stat.color)} />
                  <div className="text-[12px] font-bold text-white/80 font-display leading-none">{stat.value}</div>
                  <div className="text-[9px] text-white/25 mt-0.5 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Study packs */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Study Packs</span>
                <span className="text-[10px] text-amber-400 cursor-pointer">View all →</span>
              </div>
              <div className="space-y-1.5">
                {studyPacks.map((pack) => (
                  <div
                    key={pack.title}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2",
                      pack.color
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-white/40 shrink-0" />
                      <div>
                        <div className="text-[11px] font-medium text-white/70">{pack.title}</div>
                        <div className="text-[9px] text-white/30">{pack.cards} flashcards</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                          style={{ width: `${pack.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 w-7 text-right">{pack.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI suggestion bar */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-400/80">
                AI suggests: Review <strong>Organic Chemistry Ch. 4</strong> today — due for spaced repetition
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default BrowserMockup;
