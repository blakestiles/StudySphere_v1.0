"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Brain,
  ClipboardCheck,
  FileText,
  Layers,
  Target,
  CalendarDays,
  Mic,
  ArrowUp,
} from "lucide-react";

const chips = [
  { label: "Explain this concept", icon: Brain, color: "violet" },
  { label: "Quiz me", icon: ClipboardCheck, color: "emerald" },
  { label: "Summarize notes", icon: FileText, color: "amber" },
  { label: "Create flashcards", icon: Layers, color: "blue" },
  { label: "Find weak areas", icon: Target, color: "rose" },
  { label: "Study plan", icon: CalendarDays, color: "sky" },
] as const;

const chipColorMap: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20",
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function AIChatCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(
        "w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0c0c16] p-6",
        "shadow-lg shadow-amber-500/[0.06]"
      )}
    >
      {/* Icon */}
      <motion.div variants={itemVariants} className="flex justify-center mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Sparkles className="h-6 w-6 text-amber-500" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div variants={itemVariants} className="text-center mb-4">
        <h3 className="font-display text-lg text-white/60">Hi there,</h3>
        <h2 className="font-display text-2xl font-semibold text-white mt-1">
          How can I help you study?
        </h2>
      </motion.div>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className="text-center text-sm text-white/40 mb-6"
      >
        I&apos;ve read all your study materials. Ask me anything or pick a
        prompt below.
      </motion.p>

      {/* Suggestion chips */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-2 mb-6"
      >
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <motion.span
              key={chip.label}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                chipColorMap[chip.color]
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {chip.label}
            </motion.span>
          );
        })}
      </motion.div>

      {/* Mock input */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
      >
        <span className="flex-1 text-sm text-white/30 select-none">
          Ask me anything about your material...
        </span>
        <button
          type="button"
          tabIndex={-1}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 transition-colors hover:text-white/50"
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-black transition-colors hover:bg-amber-400"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/25"
      >
        <Sparkles className="h-3 w-3" />
        <span>Claude AI</span>
      </motion.div>
    </motion.div>
  );
}

export default AIChatCard;
