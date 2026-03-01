"use client";

import { useEffect, useState } from "react";

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

// ── Icons ──────────────────────────────────────────────

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function EssayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function FocusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Score Badge ────────────────────────────────────────

function ScoreBadge({ score, total, label }: { score: number; total: number; label?: string }) {
  const pct = total > 0 ? score / total : 0;
  const color =
    pct >= 0.8
      ? "text-emerald-400"
      : pct >= 0.5
      ? "text-orange-400"
      : "text-red-400";

  return (
    <div className="text-right">
      <p className={`text-lg font-bold ${color}`}>
        {score}/{total}
      </p>
      {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────

export default function HistoryList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("quizzes");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivities(data);
      })
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

  const filtered = activities.filter((a) => {
    if (tab === "quizzes") return a.type === "quiz";
    if (tab === "essays") return a.type === "essay";
    return a.type === "focus";
  });

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "quizzes", label: "Quizzes", icon: <QuizIcon className="h-3.5 w-3.5" /> },
    { key: "essays", label: "Essays", icon: <EssayIcon className="h-3.5 w-3.5" /> },
    { key: "focus", label: "Focus Sessions", icon: <FocusIcon className="h-3.5 w-3.5" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-background py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((t) => {
          const count = activities.filter((a) =>
            t.key === "quizzes" ? a.type === "quiz" : t.key === "essays" ? a.type === "essay" : a.type === "focus"
          ).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              {count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.key ? "bg-orange-500/20 text-orange-400" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No {tab === "quizzes" ? "quiz" : tab === "essays" ? "essay" : "focus session"} history yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((activity) => (
            <HistoryEntry
              key={activity._id}
              activity={activity}
              isExpanded={expanded.has(activity._id)}
              onToggle={() => toggleExpand(activity._id)}
            />
          ))}
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
}: {
  activity: Activity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(activity.date)}</p>
        </div>

        {/* Metric */}
        <div className="shrink-0">
          {activity.type === "quiz" && (
            <ScoreBadge score={activity.score} total={activity.totalQuestions} label="Score" />
          )}
          {activity.type === "essay" && (
            <ScoreBadge score={activity.scores.overall} total={10} label="Score" />
          )}
          {activity.type === "focus" && (
            <div className="text-right">
              <p className="text-lg font-bold text-blue-400">{formatDuration(activity.duration)}</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border px-5 py-4">
          {activity.type === "quiz" && <QuizDetails activity={activity} />}
          {activity.type === "essay" && <EssayDetails activity={activity} />}
          {activity.type === "focus" && <FocusDetails activity={activity} />}
        </div>
      )}
    </div>
  );
}

// ── Quiz Details ───────────────────────────────────────

function QuizDetails({ activity }: { activity: QuizActivity }) {
  const pct = activity.totalQuestions > 0
    ? Math.round((activity.score / activity.totalQuestions) * 100)
    : 0;
  const isPerfect = activity.score === activity.totalQuestions;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground">
        You scored {activity.score}/{activity.totalQuestions}.{" "}
        {isPerfect ? (
          <span className="text-emerald-400">Perfect!</span>
        ) : pct >= 70 ? (
          <span className="text-orange-400">Good job!</span>
        ) : (
          <span className="text-red-400">Keep practicing!</span>
        )}
      </p>

      {activity.responses?.length > 0 && (
        <div className="space-y-3">
          {activity.responses.map((r, i) => (
            <div
              key={r.questionId || i}
              className="rounded-lg border border-border bg-muted/50 p-4"
            >
              <div className="flex items-start gap-3">
                {r.isCorrect ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {r.questionText || `Question ${i + 1}`}
                  </p>
                  {r.options.length > 0 && r.selectedAnswer != null && (
                    <p className="mt-1.5 text-xs">
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className={r.isCorrect ? "text-emerald-400" : "text-orange-400"}>
                        {r.options[r.selectedAnswer] || "N/A"}
                      </span>
                    </p>
                  )}
                  {!r.isCorrect && r.correctAnswer != null && r.options.length > 0 && (
                    <p className="mt-0.5 text-xs">
                      <span className="text-muted-foreground">Correct answer: </span>
                      <span className="text-emerald-400">{r.options[r.correctAnswer]}</span>
                    </p>
                  )}
                  {r.explanation && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {r.explanation}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    r.isCorrect
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {r.isCorrect ? "1/1" : "0/1"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Essay Details ──────────────────────────────────────

function EssayDetails({ activity }: { activity: EssayActivity }) {
  const criteria = [
    { key: "accuracy", label: "Accuracy" },
    { key: "depth", label: "Depth" },
    { key: "clarity", label: "Clarity" },
    { key: "criticalThinking", label: "Critical Thinking" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div>
        <p className="text-xs font-medium text-muted-foreground">Prompt</p>
        <p className="mt-1 text-sm italic text-foreground">{activity.question}</p>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {criteria.map((c) => {
          const val = activity.scores[c.key];
          return (
            <div
              key={c.key}
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center"
            >
              <p className="text-lg font-bold text-orange-400">{val}<span className="text-xs text-muted-foreground">/10</span></p>
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Per-criteria feedback */}
      {activity.feedback?.perCriteria && (
        <div className="space-y-2">
          {criteria.map((c) => {
            const fb = activity.feedback.perCriteria[c.key];
            if (!fb) return null;
            return (
              <div key={c.key} className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fb}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {activity.feedback?.summary && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">Summary</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activity.feedback.summary}</p>
        </div>
      )}

      {/* Improvements */}
      {activity.feedback?.improvements?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-foreground">Areas for Improvement</p>
          <ul className="space-y-1">
            {activity.feedback.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-400" />
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Word count */}
      <p className="text-[10px] text-muted-foreground">{activity.wordCount} words</p>
    </div>
  );
}

// ── Focus Session Details ──────────────────────────────

function FocusDetails({ activity }: { activity: FocusActivity }) {
  const totalGoals = activity.goals?.length || 0;
  const completed = activity.completedGoals?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-foreground">
        <span>Duration: <span className="font-medium text-blue-400">{formatDuration(activity.duration)}</span></span>
        {activity.sessionsCompleted != null && activity.sessionsCompleted > 0 && (
          <span>Pomodoros: <span className="font-medium text-orange-400">{activity.sessionsCompleted}</span></span>
        )}
      </div>

      {/* Goals */}
      {totalGoals > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">
            Goals ({completed}/{totalGoals} completed)
          </p>
          <div className="space-y-1.5">
            {activity.goals.map((goal, i) => {
              const isDone = activity.completedGoals?.includes(i);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2"
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isDone
                        ? "border-emerald-500/50 bg-emerald-500/20"
                        : "border-border"
                    }`}
                  >
                    {isDone && (
                      <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {goal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recap */}
      {activity.recap && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">Session Recap</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activity.recap}</p>
        </div>
      )}
    </div>
  );
}
