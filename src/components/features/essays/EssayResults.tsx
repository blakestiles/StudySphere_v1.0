"use client";

import { motion } from "motion/react";
import {
  XCircle, Lightbulb, FileText, PenLine,
  CheckCircle2, Target, AlignLeft, Brain, Crosshair,
} from "lucide-react";

interface Scores {
  accuracy: number;
  depth: number;
  clarity: number;
  criticalThinking: number;
  overall: number;
}

interface Feedback {
  perCriteria: {
    accuracy: string;
    depth: string;
    clarity: string;
    criticalThinking: string;
  };
  missedPoints: string[];
  improvements: string[];
  summary: string;
}

interface EssayResultsProps {
  scores: Scores;
  feedback: Feedback;
  wordCount: number;
  onWriteAnother: () => void;
}

/* ── Criteria config ────────────────────────────────── */

const CRITERIA = [
  {
    key: "accuracy" as keyof Scores,
    label: "Accuracy",
    icon: Crosshair,
    activeClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25",
    barClass: "bg-blue-500",
    trackClass: "bg-blue-500/15",
  },
  {
    key: "depth" as keyof Scores,
    label: "Depth",
    icon: Target,
    activeClass: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25",
    barClass: "bg-violet-500",
    trackClass: "bg-violet-500/15",
  },
  {
    key: "clarity" as keyof Scores,
    label: "Clarity",
    icon: AlignLeft,
    activeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    barClass: "bg-emerald-500",
    trackClass: "bg-emerald-500/15",
  },
  {
    key: "criticalThinking" as keyof Scores,
    label: "Critical Thinking",
    icon: Brain,
    activeClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
    barClass: "bg-amber-500",
    trackClass: "bg-amber-500/15",
  },
];

/* ── Helpers ────────────────────────────────────────── */

function scoreLabel(s: number) {
  if (s >= 8) return "Excellent";
  if (s >= 6) return "Good";
  if (s >= 4) return "Fair";
  return "Needs work";
}

function gradeConfig(pct: number) {
  if (pct >= 80) return {
    border: "border-emerald-500/20",
    bg: "from-emerald-500/[0.07]",
    bar: "from-emerald-500",
    score: "text-emerald-600 dark:text-emerald-400",
    ring: "#10b981",
    label: "Excellent Work",
  };
  if (pct >= 60) return {
    border: "border-amber-500/20",
    bg: "from-amber-500/[0.07]",
    bar: "from-amber-500",
    score: "text-amber-600 dark:text-amber-400",
    ring: "#f59e0b",
    label: "Good Effort",
  };
  return {
    border: "border-red-500/20",
    bg: "from-red-500/[0.07]",
    bar: "from-red-500",
    score: "text-red-600 dark:text-red-400",
    ring: "#ef4444",
    label: "Keep Practicing",
  };
}

/* ── Score Ring ─────────────────────────────────────── */

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  return (
    <div className="relative h-28 w-28">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" strokeWidth="7" className="stroke-muted/40" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-display text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground/60 font-medium">/ 10</span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */

export default function EssayResults({ scores, feedback, wordCount, onWriteAnother }: EssayResultsProps) {
  const pct = Math.round((scores.overall / 10) * 100);
  const cfg = gradeConfig(pct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* ── Overall score card ────────────────────────── */}
      <div className={`relative rounded-2xl border bg-card overflow-hidden ${cfg.border}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} via-transparent to-transparent pointer-events-none`} />
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.bar} via-orange-400/50 to-transparent`} />

        <div className="relative p-6 flex items-center gap-6">
          <ScoreRing score={scores.overall} color={cfg.ring} />
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${cfg.score}`}>{cfg.label}</p>
            <h2 className="font-display text-2xl font-bold text-foreground">{pct}% Score</h2>
            <p className="text-sm text-muted-foreground mt-1">{scores.overall}/10 overall · {wordCount} words written</p>
            {/* Mini criteria bar row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {CRITERIA.map(({ key, label, barClass }) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={`text-[10px] text-muted-foreground/50`}>{label}</span>
                  <span className="text-[10px] font-bold text-foreground/70">{scores[key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Criteria grid ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map(({ key, label, icon: Icon, activeClass, barClass, trackClass }, i) => {
          const s = scores[key];
          const feedbackText = feedback.perCriteria[key as keyof typeof feedback.perCriteria];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="rounded-2xl border border-border/60 bg-card p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${activeClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">{label}</span>
                </div>
                <div className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${activeClass}`}>
                  <span>{s}/10</span>
                  <span className="font-normal opacity-70">· {scoreLabel(s)}</span>
                </div>
              </div>
              {/* Bar */}
              <div className={`h-1.5 rounded-full overflow-hidden ${trackClass}`}>
                <motion.div
                  className={`h-full rounded-full ${barClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${s * 10}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.08 + 0.2 }}
                />
              </div>
              {/* Feedback */}
              <p className="text-[12px] leading-relaxed text-muted-foreground/80">{feedbackText}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Missed points ─────────────────────────────── */}
      {feedback.missedPoints.length > 0 && (
        <div className="rounded-2xl border border-red-500/15 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 border border-red-500/20">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground">Missed Key Points</h3>
            <span className="ml-auto text-[11px] text-muted-foreground/50">{feedback.missedPoints.length} point{feedback.missedPoints.length !== 1 ? "s" : ""}</span>
          </div>
          <ul className="space-y-2">
            {feedback.missedPoints.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] text-muted-foreground/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400/70 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Improvements ──────────────────────────────── */}
      {feedback.improvements.length > 0 && (
        <div className="rounded-2xl border border-amber-500/15 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground">Improvement Suggestions</h3>
            <span className="ml-auto text-[11px] text-muted-foreground/50">{feedback.improvements.length} suggestion{feedback.improvements.length !== 1 ? "s" : ""}</span>
          </div>
          <ul className="space-y-2">
            {feedback.improvements.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] text-muted-foreground/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Summary ───────────────────────────────────── */}
      {feedback.summary && (
        <div className="rounded-2xl border border-blue-500/15 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground">Summary</h3>
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground/80">{feedback.summary}</p>
        </div>
      )}

      {/* ── Write another ─────────────────────────────── */}
      <button
        onClick={onWriteAnother}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_oklch(0.76_0.17_62_/_28%)] hover:opacity-90 transition-all"
      >
        <PenLine className="h-4 w-4" />
        Write Another Essay
      </button>
    </motion.div>
  );
}
