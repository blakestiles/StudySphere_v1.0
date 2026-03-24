"use client";

import { useState } from "react";
import { toast } from "sonner";
import EssayResults from "./EssayResults";
import { AnimatedGenerateButton } from "@/components/ui/animated-generate-button";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";
import CustomSelect from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface EssayWriterProps {
  studyPacks: StudyPackOption[];
}

/* ── SVG Icons ──────────────────────────────────────── */

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

export default function EssayWriter({ studyPacks }: EssayWriterProps) {
  const [selectedPackId, setSelectedPackId] = useState("");
  const [question, setQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    scores: any;
    feedback: any;
    wordCount: number;
  } | null>(null);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const charCount = essayText.length;
  const canSubmit = charCount >= 50 && question.trim().length > 0 && !isSubmitting;

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
      <BlurFade>
        <EssayResults
          scores={results.scores}
          feedback={results.feedback}
          wordCount={results.wordCount}
          onWriteAnother={handleWriteAnother}
        />
      </BlurFade>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── Left: Form ────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full">
        <div className="space-y-5 p-2">
        {/* Question / Prompt */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Question / Prompt
          </label>
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question you want to answer, e.g., 'Explain the process of photosynthesis and its importance...'"
            className="w-full"
          />
        </div>

        {/* Reference Material */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Reference Material (optional)
          </label>
          <CustomSelect
            value={selectedPackId}
            onValueChange={setSelectedPackId}
            options={[
              { value: "", label: "Select study pack for context" },
              ...studyPacks.map((pack) => ({ value: pack._id, label: pack.title })),
            ]}
            placeholder="Select reference material..."
            disabled={isSubmitting}
          />
        </div>

        {/* Your Answer */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Your Answer
            </label>
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
          </div>
          <Textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Write your answer here..."
            rows={14}
            className="resize-none w-full"
          />
          {charCount > 0 && charCount < 50 && (
            <p className="mt-1.5 text-xs text-red-400">
              Minimum 50 characters required ({50 - charCount} more needed)
            </p>
          )}
        </div>

        {/* Submit Button */}
        <AnimatedGenerateButton
          isLoading={isSubmitting}
          idleLabel="Submit for AI Grading"
          loadingLabel="Grading your essay..."
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3"
        />
        </div>
      </div>

      {/* ── Right: Instruction Panel ──────────────────── */}
      <div className="w-full lg:w-80">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
          <div className="mb-4 rounded-xl border border-border bg-muted/50 p-4">
            <PenIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <TextShimmer className="text-sm font-medium" duration={2}>
            Write your answer and submit to receive AI-powered feedback
          </TextShimmer>
          <div className="mt-6 space-y-2 text-left">
            <p className="text-xs text-muted-foreground">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              Scored on accuracy, depth, clarity &amp; critical thinking
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              Detailed feedback on each criterion
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              Missed points &amp; improvement suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
