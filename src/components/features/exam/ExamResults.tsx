"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SparklesText } from "@/components/ui/sparkles-text";
import { GlowingStarsBackgroundCard } from "@/components/ui/glowing-stars-card";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
}

interface Response {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

interface ExamResultsProps {
  questions: Question[];
  responses: Response[];
  score: number;
  totalQuestions: number;
  timeTaken: number;
  duration: number;
  onRetake: () => void;
  onBackToSetup: () => void;
}

/* -- Icons -- */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

export default function ExamResults({
  questions,
  responses,
  score,
  totalQuestions,
  timeTaken,
  duration,
  onRetake,
  onBackToSetup,
}: ExamResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const avgTimePerQuestion =
    responses.length > 0
      ? Math.round(
          responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length
        )
      : 0;

  const timeChartData = responses.map((r, i) => ({
    name: `Q${i + 1}`,
    time: Math.round(r.timeSpent),
    correct: r.isCorrect,
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      {percentage >= 70 ? (
        <GlowingStarsBackgroundCard className="p-6 w-full text-center">
          <div className="text-5xl font-bold mb-2 flex justify-center">
            <SparklesText text={`${percentage}%`} className="text-5xl font-bold text-amber-400" />
          </div>
          <p className="text-muted-foreground text-lg">
            {score} / {totalQuestions} correct
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {formatTime(timeTaken)} / {formatTime(duration * 60)}
            </span>
            <span>Avg {avgTimePerQuestion}s per question</span>
          </div>
        </GlowingStarsBackgroundCard>
      ) : (
          <div className="p-6 text-center">
            <div className="text-5xl font-bold mb-2">
              <span
                className={
                  percentage >= 50
                    ? "text-yellow-500"
                    : "text-red-500"
                }
              >
                {percentage}%
              </span>
            </div>
            <p className="text-muted-foreground text-lg">
              {score} / {totalQuestions} correct
            </p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatTime(timeTaken)} / {formatTime(duration * 60)}
              </span>
              <span>Avg {avgTimePerQuestion}s per question</span>
            </div>
          </div>
      )}

      {/* Time Per Question Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Time Per Question (seconds)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar
                dataKey="time"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Question Review */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Question Review</h3>
        {questions.map((q, i) => {
          const response = responses.find((r) => r.questionIndex === i);
          const isCorrect = response?.isCorrect ?? false;
          const selected = response?.selectedAnswer ?? -1;

          return (
            <div
              key={i}
              className={`rounded-lg border p-4 ${
                isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {isCorrect ? (
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <XIcon className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Q{i + 1}. {q.questionText}
                  </p>
                  <span className="text-xs text-muted-foreground capitalize">
                    {q.difficulty} &middot; {response ? `${Math.round(response.timeSpent)}s` : "N/A"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-7">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`text-xs px-2 py-1 rounded ${
                      j === q.correctAnswer
                        ? "bg-green-500/20 text-green-700 dark:text-green-400 font-medium"
                        : j === selected && !isCorrect
                        ? "bg-red-500/20 text-red-700 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetake}
          className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 transition"
        >
          Retake Exam
        </button>
        <button
          onClick={onBackToSetup}
          className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition"
        >
          Back to Setup
        </button>
      </div>
    </div>
  );
}
