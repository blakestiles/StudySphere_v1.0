"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList, PenLine, Timer, ChevronDown,
  CheckCircle2, XCircle, Loader2, Clock, Target,
  AlignLeft, Brain, Crosshair, Check, History,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface QuizResponse {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  questionText: string | null;
  options: string[];
  correctAnswer: number | null;
  explanation: string | null;
}

interface QuizActivity {
  _id: string;
  type: "quiz";
  title: string;
  date: string;
  score: number;
  totalQuestions: number;
  responses: QuizResponse[];
}

interface EssayActivity {
  _id: string;
  type: "essay";
  title: string;
  date: string;
  question: string;
  essayText?: string;
  scores: {
    accuracy: number;
    depth: number;
    clarity: number;
    criticalThinking: number;
    overall: number;
  };
  feedback: {
    perCriteria: Record<string, string>;
    missedPoints: string[];
    improvements: string[];
    summary: string;
  };
  wordCount: number;
}

interface FocusActivity {
  _id: string;
  type: "focus";
  title: string;
  date: string;
  duration: number;
  goals: string[];
  completedGoals: number[];
  recap: string;
  sessionsCompleted?: number;
  workDuration?: number;
}

type Activity = QuizActivity | EssayActivity | FocusActivity;
type TabType = "quizzes" | "essays" | "focus";

// ── Helpers ────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Type config ────────────────────────────────────────

const TYPE_CONFIG = {
  quiz: {
    icon: ClipboardList,
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-500",
    accentBorder: "border-l-amber-500/50",
  },
  essay: {
    icon: PenLine,
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-500",
    accentBorder: "border-l-violet-500/50",
  },
  focus: {
    icon: Timer,
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-500",
    accentBorder: "border-l-blue-500/50",
  },
} as const;

// ── Score pill ─────────────────────────────────────────

function ScorePill({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? score / total : 0;
  const label = total <= 10 ? `${score}/${total}` : `${Math.round(pct * 100)}%`;
  const cls =
    pct >= 0.8
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : pct >= 0.5
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  return (
    <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ── Quiz Details ───────────────────────────────────────

function QuizDetails({ activity }: { activity: QuizActivity }) {
  const pct = activity.totalQuestions > 0
    ? Math.round((activity.score / activity.totalQuestions) * 100) : 0;

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted-foreground/80">
        You scored <span className="font-semibold text-foreground">{activity.score}/{activity.totalQuestions}</span> ({pct}%).{" "}
        {pct === 100
          ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">Perfect score!</span>
          : pct >= 70
          ? <span className="text-amber-600 dark:text-amber-400 font-medium">Good job!</span>
          : <span className="text-red-600 dark:text-red-400 font-medium">Keep practicing!</span>}
      </p>

      {activity.responses?.length > 0 && (
        <div className="space-y-2">
          {activity.responses.map((r, i) => (
            <div
              key={r.questionId || i}
              className={`rounded-xl border p-3 ${
                r.isCorrect
                  ? "border-emerald-500/15 bg-emerald-500/[0.04]"
                  : "border-red-500/15 bg-red-500/[0.04]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {r.isCorrect
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                }
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-foreground">
                    {r.questionText || `Question ${i + 1}`}
                  </p>
                  {r.options.length > 0 && r.selectedAnswer != null && (
                    <p className="mt-1 text-[11.5px]">
                      <span className="text-muted-foreground/70">Your answer: </span>
                      <span className={r.isCorrect ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                        {r.options[r.selectedAnswer] || "N/A"}
                      </span>
                    </p>
                  )}
                  {!r.isCorrect && r.correctAnswer != null && r.options.length > 0 && (
                    <p className="mt-0.5 text-[11.5px]">
                      <span className="text-muted-foreground/70">Correct: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{r.options[r.correctAnswer]}</span>
                    </p>
                  )}
                  {r.explanation && (
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground/70">{r.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Essay Details ──────────────────────────────────────

const ESSAY_CRITERIA = [
  { key: "accuracy", label: "Accuracy", icon: Crosshair, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "depth", label: "Depth", icon: Target, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
  { key: "clarity", label: "Clarity", icon: AlignLeft, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "criticalThinking", label: "Critical Thinking", icon: Brain, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
] as const;

function EssayDetails({ activity }: { activity: EssayActivity }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">Prompt</p>
        <p className="text-[12.5px] italic text-foreground/80 leading-relaxed">{activity.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ESSAY_CRITERIA.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={`rounded-xl border px-3 py-2 text-center ${bg}`}>
            <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
            <p className="text-[14px] font-bold font-display text-foreground leading-none">
              {activity.scores[key]}<span className="text-[9px] text-muted-foreground/60">/10</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {activity.feedback?.perCriteria && (
        <div className="space-y-2">
          {ESSAY_CRITERIA.map(({ key, label }) => {
            const fb = activity.feedback.perCriteria[key];
            if (!fb) return null;
            return (
              <div key={key} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold text-foreground/80 mb-0.5">{label}</p>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground/70">{fb}</p>
              </div>
            );
          })}
        </div>
      )}

      {activity.feedback?.summary && (
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-3">
          <p className="text-[11px] font-semibold text-foreground/80 mb-0.5">Summary</p>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground/70">{activity.feedback.summary}</p>
        </div>
      )}

      {activity.feedback?.improvements?.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold text-foreground/80">Areas to Improve</p>
          <ul className="space-y-1.5">
            {activity.feedback.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] text-muted-foreground/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10.5px] text-muted-foreground/50">{activity.wordCount} words written</p>
    </div>
  );
}

// ── Focus Details ──────────────────────────────────────

function FocusDetails({ activity }: { activity: FocusActivity }) {
  const totalGoals = activity.goals?.length || 0;
  const completed = activity.completedGoals?.length || 0;
  const goalPct = totalGoals > 0 ? Math.round((completed / totalGoals) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-[12px] text-foreground">
          <Clock className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium">{formatDuration(activity.duration)}</span>
          <span className="text-muted-foreground/60">duration</span>
        </span>
        {activity.sessionsCompleted != null && activity.sessionsCompleted > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-[12px] text-foreground">
            <Timer className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">{activity.sessionsCompleted}</span>
            <span className="text-muted-foreground/60">pomodoros</span>
          </span>
        )}
        {totalGoals > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-[12px] text-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-medium">{completed}/{totalGoals}</span>
            <span className="text-muted-foreground/60">goals</span>
          </span>
        )}
      </div>

      {totalGoals > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="font-semibold text-foreground/80">Goals</span>
            <span className="text-muted-foreground/60">{goalPct}% complete</span>
          </div>
          <div className="space-y-1.5">
            {activity.goals.map((goal, i) => {
              const isDone = activity.completedGoals?.includes(i);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                    isDone ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                    isDone ? "border-emerald-500/40 bg-emerald-500/20" : "border-border/60"
                  }`}>
                    {isDone && <Check className="h-2.5 w-2.5 text-emerald-500" strokeWidth={3} />}
                  </div>
                  <span className={`text-[12px] ${isDone ? "text-muted-foreground/60 line-through" : "text-foreground/80"}`}>
                    {goal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activity.recap && (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
          <p className="text-[11px] font-semibold text-foreground/80 mb-1">Session Recap</p>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground/70">{activity.recap}</p>
        </div>
      )}
    </div>
  );
}

// ── History Entry ──────────────────────────────────────

function HistoryEntry({
  activity,
  isExpanded,
  onToggle,
  index,
}: {
  activity: Activity;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const cfg = TYPE_CONFIG[activity.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`overflow-hidden rounded-2xl border border-border/60 border-l-2 bg-card ${cfg.accentBorder}`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Type icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cfg.iconBg}`}>
          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
        </div>

        {/* Title + date */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground truncate">{activity.title}</p>
          <p className="text-[11px] text-muted-foreground/60">{formatDate(activity.date)}</p>
        </div>

        {/* Metric */}
        <div className="shrink-0">
          {activity.type === "quiz" && (
            <ScorePill score={activity.score} total={activity.totalQuestions} />
          )}
          {activity.type === "essay" && (
            <ScorePill score={activity.scores.overall} total={10} />
          )}
          {activity.type === "focus" && (
            <span className="flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />{formatDuration(activity.duration)}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-4 py-4">
              {activity.type === "quiz" && <QuizDetails activity={activity} />}
              {activity.type === "essay" && <EssayDetails activity={activity} />}
              {activity.type === "focus" && <FocusDetails activity={activity} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function HistoryList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("quizzes");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setActivities(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs: { key: TabType; label: string; icon: React.ElementType; type: Activity["type"] }[] = [
    { key: "quizzes", label: "Quizzes", icon: ClipboardList, type: "quiz" },
    { key: "essays", label: "Essays", icon: PenLine, type: "essay" },
    { key: "focus", label: "Focus", icon: Timer, type: "focus" },
  ];

  const filtered = activities.filter((a) => {
    if (tab === "quizzes") return a.type === "quiz";
    if (tab === "essays") return a.type === "essay";
    return a.type === "focus";
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Loading history…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1">
        {tabs.map((t) => {
          const count = activities.filter((a) => a.type === t.type).length;
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition-all ${
                isActive ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-muted/60 text-muted-foreground/60"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-14 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border/40">
              <History className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No history yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Complete a {tab === "quizzes" ? "quiz" : tab === "essays" ? "practice essay" : "focus session"} to see it here.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-2"
          >
            {filtered.map((activity, index) => (
              <HistoryEntry
                key={activity._id}
                activity={activity}
                isExpanded={expanded.has(activity._id)}
                onToggle={() => toggleExpand(activity._id)}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
