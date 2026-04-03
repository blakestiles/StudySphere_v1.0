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
import { motion } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
  ArrowLeft,
  TrendingUp,
  BarChart3,
} from "lucide-react";

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

  const scoreColors =
    percentage >= 80
      ? {
          border: "border-emerald-500/20",
          bgWash: "from-emerald-500/[0.07]",
          topBar: "from-emerald-500 via-emerald-400",
          text: "text-emerald-500",
          label: "Excellent",
        }
      : percentage >= 60
      ? {
          border: "border-amber-500/20",
          bgWash: "from-amber-500/[0.07]",
          topBar: "from-amber-500 via-orange-400",
          text: "text-amber-500",
          label: "Good",
        }
      : {
          border: "border-red-500/20",
          bgWash: "from-red-500/[0.07]",
          topBar: "from-red-500 via-red-400",
          text: "text-red-500",
          label: "Needs Work",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* Score Card */}
      <div className={`relative rounded-2xl border ${scoreColors.border} bg-card overflow-hidden`}>
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scoreColors.topBar} to-transparent`} />
        <div className={`absolute inset-0 bg-gradient-to-br ${scoreColors.bgWash} via-transparent to-transparent pointer-events-none`} />
        <div className="p-6 relative text-center">
          <p className={`font-display text-6xl font-bold ${scoreColors.text}`}>
            {percentage}%
          </p>
          <p className="text-[13px] font-semibold text-muted-foreground mt-1">{scoreColors.label}</p>
          <p className="text-lg text-muted-foreground mt-0.5">
            {score} / {totalQuestions} correct
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeTaken)} / {formatTime(duration * 60)}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Avg {avgTimePerQuestion}s per question
            </span>
          </div>
        </div>
      </div>

      {/* Time Per Question Chart */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-foreground">Time Per Question</h3>
          <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="time" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-foreground">Question Review</h3>
          <span className="text-[11px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1">
            {score}/{totalQuestions} correct
          </span>
        </div>

        {questions.map((q, i) => {
          const response = responses.find((r) => r.questionIndex === i);
          const isCorrect = response?.isCorrect ?? false;
          const selected = response?.selectedAnswer ?? -1;

          return (
            <div
              key={i}
              className={`rounded-2xl border p-4 ${
                isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-red-500/20 bg-red-500/[0.04]"
              }`}
            >
              <div className="flex items-start gap-2.5 mb-3">
                {isCorrect ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Q{i + 1}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 capitalize">
                      {q.difficulty}
                    </span>
                    {response && (
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(response.timeSpent)}s
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] font-medium text-foreground leading-snug">
                    {q.questionText}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-7">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`text-xs rounded-lg px-2.5 py-1.5 ${
                      j === q.correctAnswer
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/25"
                        : j === selected && !isCorrect
                        ? "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25"
                        : "text-muted-foreground/60"
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
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition"
        >
          <RotateCcw className="h-4 w-4" />
          Retake Exam
        </button>
        <button
          onClick={onBackToSetup}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted/50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Setup
        </button>
      </div>
    </motion.div>
  );
}
