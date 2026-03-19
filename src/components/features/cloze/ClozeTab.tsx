"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface ClozeQuestion {
  _id: string;
  originalText: string;
  blankedText: string;
  answers: string[];
  blankCount: number;
}

interface BlankResult {
  blankIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuestionResult {
  questionId: string;
  blankedText: string;
  results: BlankResult[];
}

interface SubmitResult {
  totalBlanks: number;
  correctBlanks: number;
  score: number;
  questions: QuestionResult[];
}

export default function ClozeTab({ questions }: { questions: ClozeQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const q of questions) {
      init[q._id] = Array(q.blankCount).fill("");
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmitResult | null>(null);

  const updateAnswer = (questionId: string, blankIndex: number, value: string) => {
    setAnswers((prev) => {
      const arr = [...(prev[questionId] || [])];
      arr[blankIndex] = value;
      return { ...prev, [questionId]: arr };
    });
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const payload = {
        questions: questions.map((q) => ({
          questionId: q._id,
          userAnswers: answers[q._id] || [],
        })),
      };
      const res = await fetch("/api/cloze/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setResults(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting answers");
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    const init: Record<string, string[]> = {};
    for (const q of questions) {
      init[q._id] = Array(q.blankCount).fill("");
    }
    setAnswers(init);
    setResults(null);
  };

  const renderBlankedText = (text: string, questionId: string, readOnly?: boolean, qResult?: QuestionResult) => {
    const parts = text.split(/({{BLANK_\d+}})/);
    return (
      <span className="leading-relaxed">
        {parts.map((part, i) => {
          const match = part.match(/{{BLANK_(\d+)}}/);
          if (!match) return <span key={i}>{part}</span>;

          const blankIndex = parseInt(match[1], 10) - 1;

          if (readOnly && qResult) {
            const br = qResult.results[blankIndex];
            if (!br) return <span key={i} className="text-muted-foreground">[?]</span>;
            return (
              <span key={i} className="inline-flex flex-col items-center mx-1">
                {br.isCorrect ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 font-medium text-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    {br.userAnswer}
                  </span>
                ) : (
                  <span className="inline-flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 line-through text-sm">
                      <XCircle className="h-3 w-3" />
                      {br.userAnswer || "(empty)"}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                      {br.correctAnswer}
                    </span>
                  </span>
                )}
              </span>
            );
          }

          const val = answers[questionId]?.[blankIndex] || "";
          return (
            <input
              key={i}
              type="text"
              value={val}
              onChange={(e) => updateAnswer(questionId, blankIndex, e.target.value)}
              placeholder={`blank ${blankIndex + 1}`}
              className="inline-block w-32 mx-1 px-2 py-0.5 border-b-2 border-orange-500/50 bg-orange-500/5 text-foreground text-sm text-center focus:outline-none focus:border-orange-500 rounded-sm"
            />
          );
        })}
      </span>
    );
  };

  // Results view
  if (results) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Fill-in-the-Blank Results</h2>
          <div className="text-4xl font-bold mt-2" style={{
            color: results.score >= 70 ? "var(--color-green-500, #22c55e)" : results.score >= 40 ? "var(--color-orange-500, #f97316)" : "var(--color-red-500, #ef4444)",
          }}>
            {results.score}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {results.correctBlanks} of {results.totalBlanks} blanks correct
          </p>
        </div>

        <div className="space-y-3">
          {results.questions.map((qr, idx) => (
            <div key={qr.questionId} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-2">Question {idx + 1}</div>
              <div className="text-sm text-foreground">
                {renderBlankedText(qr.blankedText, qr.questionId, true, qr)}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={resetQuiz}
          className="w-full py-2.5 rounded-xl border border-border text-foreground hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Active view
  const allFilled = questions.every((q) =>
    (answers[q._id] || []).every((a) => a.trim().length > 0)
  );

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q._id} className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-2">Question {idx + 1}</div>
          <div className="text-sm text-foreground">
            {renderBlankedText(q.blankedText, q._id)}
          </div>
        </div>
      ))}

      <button
        onClick={submitAnswers}
        disabled={!allFilled || submitting}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {submitting ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Answers
          </>
        )}
      </button>
    </div>
  );
}
