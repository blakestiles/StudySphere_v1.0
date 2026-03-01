"use client";

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

const criteriaLabels: { key: keyof Scores; label: string; color: string }[] = [
  { key: "accuracy", label: "Accuracy", color: "#3b82f6" },
  { key: "depth", label: "Depth", color: "#8b5cf6" },
  { key: "clarity", label: "Clarity", color: "#10b981" },
  { key: "criticalThinking", label: "Critical Thinking", color: "#f97316" },
];

function scoreLabel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Fair";
  return "Needs work";
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-amber-400";
  return "text-red-400";
}

function barColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-amber-500";
  return "bg-red-500";
}

/* ── Score Ring ──────────────────────────────────────── */

function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / max) * circumference;
  const color = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

export default function EssayResults({
  scores,
  feedback,
  wordCount,
  onWriteAnother,
}: EssayResultsProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center rounded-xl border border-border bg-card py-8">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Overall Score</p>
        <ScoreRing score={scores.overall} />
        <p className="mt-3 text-sm text-muted-foreground">{wordCount} words</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {scores.overall >= 8
            ? "Excellent work!"
            : scores.overall >= 6
              ? "Good effort, room for improvement."
              : "Keep practicing, you can do better!"}
        </p>
      </div>

      {/* Criteria Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {criteriaLabels.map(({ key, label, color }) => {
          const score = scores[key];
          const feedbackText =
            feedback.perCriteria[key as keyof typeof feedback.perCriteria];
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span
                  className="rounded-lg px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: `${color}20`,
                    color,
                  }}
                >
                  {score}/10 &middot; {scoreLabel(score)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${barColor(score)}`}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{feedbackText}</p>
            </div>
          );
        })}
      </div>

      {/* Missed Key Points */}
      {feedback.missedPoints.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Missed Key Points
          </h3>
          <ul className="space-y-1.5">
            {feedback.missedPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Suggestions */}
      {feedback.improvements.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Improvement Suggestions
          </h3>
          <ul className="space-y-1.5">
            {feedback.improvements.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {feedback.summary && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Summary
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{feedback.summary}</p>
        </div>
      )}

      {/* Write Another */}
      <div className="text-center">
        <button
          onClick={onWriteAnother}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          Write Another Essay
        </button>
      </div>
    </div>
  );
}
