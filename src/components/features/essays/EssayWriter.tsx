"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import EssayResults from "./EssayResults";
import CustomSelect from "@/components/ui/custom-select";
import { Sparkles, PenLine, Send, BookOpen, Loader2, RotateCcw } from "lucide-react";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface EssayWriterProps {
  studyPacks: StudyPackOption[];
}

export default function EssayWriter({ studyPacks }: EssayWriterProps) {
  const [selectedPackId, setSelectedPackId] = useState("");
  const [question, setQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [results, setResults] = useState<{
    scores: any;
    feedback: any;
    wordCount: number;
  } | null>(null);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const charCount = essayText.length;
  const canSubmit = charCount >= 50 && question.trim().length > 0 && !isSubmitting;
  const charProgress = Math.min(100, (charCount / 50) * 100);

  async function handleGenerateQuestion() {
    if (!selectedPackId || isGeneratingQuestion) return;
    setIsGeneratingQuestion(true);
    try {
      const res = await fetch("/api/essays/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyPackId: selectedPackId }),
      });
      if (!res.ok) throw new Error("Failed to generate question");
      const data = await res.json();
      setQuestion(data.question);
    } catch {
      toast.error("Failed to generate question");
    } finally {
      setIsGeneratingQuestion(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/essays/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: selectedPackId || undefined,
          question: question.trim(),
          essayText: essayText.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to grade essay");
      }
      const data = await res.json();
      setResults({
        scores: data.attempt.scores,
        feedback: data.attempt.feedback,
        wordCount: data.attempt.wordCount,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grade essay");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleWriteAnother() {
    setResults(null);
    setQuestion("");
    setEssayText("");
    setSelectedPackId("");
  }

  if (results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <EssayResults
          scores={results.scores}
          feedback={results.feedback}
          wordCount={results.wordCount}
          onWriteAnother={handleWriteAnother}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* ── Question card ─────────────────────────────── */}
      <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

        <div className="relative p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-amber-500/20 blur-lg" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                <PenLine className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold text-foreground">Question / Prompt</h2>
              <p className="text-[11px] text-muted-foreground/60">Enter manually or auto-generate from your study pack</p>
            </div>
          </div>

          {/* Study pack + generate row */}
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <CustomSelect
                value={selectedPackId}
                onValueChange={setSelectedPackId}
                options={[
                  { value: "", label: "No reference material…" },
                  ...studyPacks.map((p) => ({ value: p._id, label: p.title })),
                ]}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateQuestion}
              disabled={!selectedPackId || isGeneratingQuestion}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isGeneratingQuestion
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              {isGeneratingQuestion ? "Generating…" : "Auto-generate"}
            </button>
          </div>

          {/* Question input */}
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question you want to answer, e.g. 'Explain the process of photosynthesis and its importance…'"
              rows={2}
              className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
            />
            {question && (
              <button
                onClick={() => setQuestion("")}
                className="absolute right-3 top-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Writing area card ─────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-[13px] font-medium text-foreground">Your Answer</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Word count */}
            <span className={`text-[11px] tabular-nums font-medium ${wordCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"}`}>
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            {/* Char count */}
            <span className="text-[11px] tabular-nums text-muted-foreground/40">
              {charCount} chars
            </span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          placeholder="Write your answer here. Be thorough — explain concepts clearly, support your points with evidence, and demonstrate critical thinking…"
          rows={14}
          className="w-full bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none resize-none"
        />

        {/* Footer: min-char progress + submit */}
        <div className="border-t border-border/40 px-5 py-3 space-y-3">
          {/* Min char progress */}
          <AnimatePresence>
            {charCount > 0 && charCount < 50 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/60">Minimum length</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{charCount}/50 chars</span>
                </div>
                <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${charProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit row */}
          <div className="flex items-center justify-between gap-3">
            {/* Criteria reminder */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["Accuracy", "Depth", "Clarity", "Thinking"].map((c) => (
                <span key={c} className="text-[10px] text-muted-foreground/45 bg-muted/40 rounded-md px-1.5 py-0.5 border border-border/40">
                  {c}
                </span>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_28%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Grading…</>
                : <><Send className="h-3.5 w-3.5" /> Submit for Grading</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Scoring criteria hint */}
      <div className="rounded-2xl border border-border/40 bg-muted/20 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-3">Scoring Criteria</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            { label: "Accuracy", desc: "Factual correctness", color: "bg-blue-500" },
            { label: "Depth", desc: "Thoroughness of analysis", color: "bg-violet-500" },
            { label: "Clarity", desc: "Clear communication", color: "bg-emerald-500" },
            { label: "Critical Thinking", desc: "Reasoning & insight", color: "bg-amber-500" },
          ].map(({ label, desc, color }) => (
            <div key={label} className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${color}`} />
              <div>
                <p className="text-[11.5px] font-medium text-foreground/70">{label}</p>
                <p className="text-[10.5px] text-muted-foreground/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
