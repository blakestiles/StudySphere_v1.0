"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Send, RotateCcw, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

interface StudyPackOption {
  _id: string;
  title: string;
}

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

type Phase = "setup" | "loading" | "active" | "results";

export default function FillInBlank({ studyPacks }: { studyPacks: StudyPackOption[] }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedPack, setSelectedPack] = useState("");
  const [questions, setQuestions] = useState<ClozeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmitResult | null>(null);

  const generateQuestions = async () => {
    if (!selectedPack) {
      toast.error("Please select a study pack");
      return;
    }
    setPhase("loading");
    try {
      const res = await fetch("/api/cloze/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyPackId: selectedPack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setQuestions(data.questions);
      // Initialize answers
      const init: Record<string, string[]> = {};
      for (const q of data.questions) {
        init[q._id] = Array(q.blankCount).fill("");
      }
      setAnswers(init);
      setPhase("active");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generating questions");
      setPhase("setup");
    }
  };

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
      setPhase("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting answers");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBlankedText = (text: string, questionId: string, readOnly?: boolean, qResult?: QuestionResult) => {
    // Split text by {{BLANK_N}} patterns
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

  // SETUP
  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Study Pack
            </label>
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select a study pack...</option>
              {studyPacks.map((sp) => (
                <option key={sp._id} value={sp._id}>
                  {sp.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateQuestions}
            disabled={!selectedPack}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Generate Questions
          </button>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          AI is creating fill-in-the-blank questions...
        </p>
      </div>
    );
  }

  // RESULTS
  if (phase === "results" && results) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-foreground">Results</h2>
          <div className="text-4xl font-bold mt-2" style={{
            color: results.score >= 70 ? "var(--color-green-500, #22c55e)" : results.score >= 40 ? "var(--color-orange-500, #f97316)" : "var(--color-red-500, #ef4444)",
          }}>
            {results.score}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {results.correctBlanks} of {results.totalBlanks} blanks correct
          </p>
        </div>

        {/* Per-question results */}
        <div className="space-y-4">
          {results.questions.map((qr, idx) => (
            <div key={qr.questionId} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-2">Question {idx + 1}</div>
              <div className="text-sm text-foreground">
                {renderBlankedText(qr.blankedText, qr.questionId, true, qr)}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const init: Record<string, string[]> = {};
              for (const q of questions) {
                init[q._id] = Array(q.blankCount).fill("");
              }
              setAnswers(init);
              setResults(null);
              setPhase("active");
            }}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => {
              setQuestions([]);
              setAnswers({});
              setResults(null);
              setPhase("setup");
            }}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Generate New
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE
  const allFilled = questions.every((q) =>
    (answers[q._id] || []).every((a) => a.trim().length > 0)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {questions.map((q, idx) => (
        <div key={q._id} className="bg-card border border-border rounded-xl p-4">
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
