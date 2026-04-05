"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import MathText from "@/components/ui/math-text";
interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  sourcePage?: number | null;
  topicId?: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  nextReviewAt?: string;
  lastSeenAt?: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

type Rating = "again" | "hard" | "good" | "easy";

const ratingConfig: { value: Rating; label: string; color: string }[] = [
  { value: "again", label: "Again", color: "bg-red-500 hover:bg-red-600 text-white" },
  { value: "hard", label: "Hard", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { value: "good", label: "Good", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "easy", label: "Easy", color: "bg-green-500 hover:bg-green-600 text-white" },
];

export default function FlashcardViewer({ flashcards: initialFlashcards }: FlashcardViewerProps) {
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const dueCount = useMemo(() => {
    const now = new Date();
    return flashcards.filter((f) => {
      if (!f.nextReviewAt) return true;
      return new Date(f.nextReviewAt) <= now;
    }).length;
  }, [flashcards]);

  const filtered = useMemo(() => {
    let cards = flashcards;
    if (difficultyFilter) {
      cards = cards.filter((f) => f.difficulty === difficultyFilter);
    }
    // Sort: due cards first, then by nextReviewAt ascending
    const now = new Date();
    return [...cards].sort((a, b) => {
      const aDue = !a.nextReviewAt || new Date(a.nextReviewAt) <= now;
      const bDue = !b.nextReviewAt || new Date(b.nextReviewAt) <= now;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      const aDate = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
      const bDate = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
      return aDate - bDate;
    });
  }, [flashcards, difficultyFilter]);

  function handleFilterChange(filter: string | null) {
    setDifficultyFilter(filter);
    setCurrentIndex(0);
    setIsFlipped(false);
    stopSpeaking();
  }

  function handlePrev() {
    setIsFlipped(false);
    stopSpeaking();
    setCurrentIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
  }

  function handleNext() {
    setIsFlipped(false);
    stopSpeaking();
    setCurrentIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
  }

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  function toggleTTS() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const card = filtered[currentIndex];
    if (!card) return;

    const text = isFlipped ? card.answer : card.question;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  async function handleRate(rating: Rating) {
    const card = filtered[currentIndex];
    if (!card || isRating) return;

    setIsRating(true);
    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: card._id, rating }),
      });

      if (!res.ok) throw new Error("Failed to rate flashcard");

      const data = await res.json();
      const updated = data.flashcard;

      // Update local state with new SM-2 values
      setFlashcards((prev) =>
        prev.map((f) =>
          f._id === card._id
            ? {
                ...f,
                easeFactor: updated.easeFactor,
                intervalDays: updated.intervalDays,
                repetitions: updated.repetitions,
                nextReviewAt: updated.nextReviewAt,
                lastSeenAt: updated.lastSeenAt,
              }
            : f
        )
      );

      // Auto-advance
      setIsFlipped(false);
      stopSpeaking();
      if (filtered.length > 1) {
        setCurrentIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
      }
    } catch {
      toast.error("Failed to save review.");
    } finally {
      setIsRating(false);
    }
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No flashcards available.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-5">
        <FilterBar
          current={difficultyFilter}
          onChange={handleFilterChange}
          counts={flashcards}
          dueCount={dueCount}
        />
        <div className="text-center py-12 text-muted-foreground">
          No flashcards match this filter.
        </div>
      </div>
    );
  }

  const card = filtered[currentIndex];

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <FilterBar
        current={difficultyFilter}
        onChange={handleFilterChange}
        counts={flashcards}
        dueCount={dueCount}
      />

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Card {currentIndex + 1} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            {filtered.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "block rounded-full transition-all duration-200",
                  i === currentIndex
                    ? "h-2 w-2 bg-orange-500"
                    : "h-1.5 w-1.5 bg-border"
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              difficultyColors[card.difficulty]
            )}
          >
            {card.difficulty}
          </span>
          <button
            onClick={toggleTTS}
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              isSpeaking
                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Flashcard with 3D Flip */}
      <div className="cursor-pointer rounded-2xl" onClick={() => { setIsFlipped(!isFlipped); stopSpeaking(); }}>
        <div style={{ perspective: "1000px" }}>
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front - Question */}
            <div
              className="w-full min-h-[250px] rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Question
              </span>
              <p className="text-lg font-medium text-foreground leading-relaxed max-w-lg">
                <MathText text={card.question} />
              </p>
              {card.sourcePage && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-2">
                  <BookOpen className="h-3 w-3" />
                  p. {card.sourcePage}
                </span>
              )}
              <span className="text-xs text-muted-foreground mt-6 opacity-60">
                Click to reveal
              </span>
            </div>

            {/* Back - Answer */}
            <div
              className="absolute inset-0 w-full min-h-[250px] rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Answer
              </span>
              <p className="text-lg text-foreground leading-relaxed max-w-lg">
                <MathText text={card.answer} />
              </p>
              {card.sourcePage && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-2">
                  <BookOpen className="h-3 w-3" />
                  p. {card.sourcePage}
                </span>
              )}
              <span className="text-xs text-muted-foreground mt-6 opacity-60">
                Click to flip back
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SM-2 Rating Buttons */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-2.5 pt-1">
          {ratingConfig.map((r) => (
            <button
              key={r.value}
              disabled={isRating}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                r.color,
                isRating && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => { e.stopPropagation(); handleRate(r.value); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handlePrev}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FilterBar({
  current,
  onChange,
  counts,
  dueCount,
}: {
  current: string | null;
  onChange: (filter: string | null) => void;
  counts: Flashcard[];
  dueCount: number;
}) {
  const filters = [
    { label: "All", value: null, count: counts.length },
    { label: "Easy", value: "easy", count: counts.filter((f) => f.difficulty === "easy").length },
    { label: "Medium", value: "medium", count: counts.filter((f) => f.difficulty === "medium").length },
    { label: "Hard", value: "hard", count: counts.filter((f) => f.difficulty === "hard").length },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const isActive = current === f.value;
        return (
          <button
            key={f.label}
            onClick={() => onChange(f.value)}
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-orange-500 text-white shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label} ({f.count})
          </button>
        );
      })}
      {dueCount > 0 && (
        <span className="ml-1 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          {dueCount} due
        </span>
      )}
    </div>
  );
}
