"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ExamResults from "./ExamResults";
import ShimmerButton from "@/components/ui/shimmer-button";
import BlurFade from "@/components/ui/blur-fade";
import Meteors from "@/components/ui/meteors";
import { SparklesText } from "@/components/ui/sparkles-text";
import { GlowingStarsBackgroundCard } from "@/components/ui/glowing-stars-card";
import CustomSelect from "@/components/ui/custom-select";

interface StudyPackOption {
  _id: string;
  title: string;
}

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

interface ExamSimulatorProps {
  studyPacks: StudyPackOption[];
}

/* -- Icons -- */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="5,3 19,12 5,21" fill="currentColor" />
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

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

type Phase = "setup" | "active" | "complete";

export default function ExamSimulator({ studyPacks }: ExamSimulatorProps) {
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup state
  const [selectedPackId, setSelectedPackId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(30);
  const [proctored, setProctored] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const timeSpentRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const tabViolationCount = useRef(0);

  // Complete state
  const [examResult, setExamResult] = useState<{
    questions: Question[];
    responses: Response[];
    score: number;
    totalQuestions: number;
    timeTaken: number;
    duration: number;
  } | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const submitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Record time for current question
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    timeSpentRef.current[currentIndex] =
      (timeSpentRef.current[currentIndex] || 0) + elapsed;

    const responses: Response[] = questions.map((q, i) => ({
      questionIndex: i,
      selectedAnswer: answers[i] ?? -1,
      isCorrect: answers[i] === q.correctAnswer,
      timeSpent: timeSpentRef.current[i] || 0,
    }));

    const score = responses.filter((r) => r.isCorrect).length;
    const totalTime = duration * 60 - timeLeft;

    try {
      await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: selectedPackId,
          questions,
          responses,
          duration,
          timeTaken: totalTime,
          proctored,
        }),
      });
    } catch {
      // Save failed but still show results
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    setExamResult({
      questions,
      responses,
      score,
      totalQuestions: questions.length,
      timeTaken: totalTime,
      duration,
    });
    setPhase("complete");
  }, [questions, answers, currentIndex, duration, timeLeft, selectedPackId, proctored]);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          toast.info("Time is up! Auto-submitting exam.");
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, submitExam]);

  // Fullscreen monitoring for proctored mode
  useEffect(() => {
    if (phase !== "active" || !proctored) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenWarning(true);
        toast.warning("You exited fullscreen! Return to fullscreen to continue.");
        // Try to re-enter fullscreen after a brief delay
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => {
            toast.error("Could not re-enter fullscreen. Please click 'Return to Fullscreen'.");
          });
        }, 500);
      } else {
        setFullscreenWarning(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [phase, proctored]);

  // Tab switch / visibility change detection for proctored mode
  useEffect(() => {
    if (phase !== "active" || !proctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabViolationCount.current += 1;
        const count = tabViolationCount.current;

        if (count >= 3) {
          toast.error("Too many tab switches! Auto-submitting exam.");
          submitExam();
          return;
        }

        setTabWarning(true);
        toast.warning(
          `Warning ${count}/3: You left this window! ${3 - count} more and your exam will be auto-submitted.`
        );
      }
    };

    const handleWindowBlur = () => {
      if (!proctored || phase !== "active") return;
      // Only count if document isn't hidden (handles Alt+Tab, clicking other windows)
      if (!document.hidden) {
        tabViolationCount.current += 1;
        const count = tabViolationCount.current;

        if (count >= 3) {
          toast.error("Too many window switches! Auto-submitting exam.");
          submitExam();
          return;
        }

        setTabWarning(true);
        toast.warning(
          `Warning ${count}/3: You left this window! ${3 - count} more and your exam will be auto-submitted.`
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [phase, proctored, submitExam]);


  async function handleGenerate() {
    if (!selectedPackId) {
      toast.error("Please select a study pack");
      return;
    }

    // Enter fullscreen BEFORE the async fetch — browsers require user gesture
    if (proctored) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        toast.info("Could not enter fullscreen. Try pressing F11 manually.");
        setFullscreenWarning(true);
      }
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: selectedPackId,
          difficulty,
          questionCount,
          duration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate exam");
      }

      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      timeSpentRef.current = new Array(data.questions.length).fill(0);
      setCurrentIndex(0);
      setTimeLeft(duration * 60);
      questionStartRef.current = Date.now();

      setPhase("active");
      toast.success("Exam generated! Good luck!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate exam"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  function navigateQuestion(index: number) {
    // Save time spent on current question
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    timeSpentRef.current[currentIndex] =
      (timeSpentRef.current[currentIndex] || 0) + elapsed;
    questionStartRef.current = Date.now();
    setCurrentIndex(index);
  }

  // ── SETUP PHASE ──
  if (phase === "setup") {
    return (
      <div className="relative overflow-hidden max-w-2xl space-y-6">
        <Meteors count={8} className="opacity-30" />
        <div className="space-y-6 p-2">
        {/* Study Pack */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Study Pack</label>
          <CustomSelect
            value={selectedPackId}
            onValueChange={setSelectedPackId}
            options={[
              { value: "", label: "Select a study pack..." },
              ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
            ]}
            placeholder="Select a study pack..."
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {(["easy", "medium", "hard", "mixed"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-2 rounded-lg text-sm font-medium capitalize transition ${
                  difficulty === d
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                    : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Questions: {questionCount}
          </label>
          <input
            type="range"
            min={5}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Duration: {duration} minutes
          </label>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>180 min</span>
          </div>
        </div>

        {/* Proctored Toggle */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <ShieldIcon className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Proctored Mode</p>
            <p className="text-xs text-muted-foreground">
              Fullscreen enforced. Exam auto-submits if you exit.
            </p>
          </div>
          <button
            onClick={() => setProctored(!proctored)}
            className={`w-11 h-6 rounded-full transition-colors ${
              proctored ? "bg-orange-500" : "bg-muted"
            } relative`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                proctored ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <ShimmerButton
            onClick={(!selectedPackId || isGenerating) ? undefined : handleGenerate}
            className={`px-8 py-3 text-base font-semibold rounded-2xl ${(!selectedPackId || isGenerating) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Exam...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Start Exam
              </>
            )}
          </ShimmerButton>
        </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE PHASE ──
  if (phase === "active" && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const answeredCount = answers.filter((a) => a !== null).length;
    const isTimeWarning = timeLeft < 60;

    return (
      <div className="space-y-4">
        {/* Header: Timer + Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-mono font-medium ${
              isTimeWarning ? "text-red-500 animate-pulse" : "text-foreground"
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateQuestion(i)}
              className={`w-8 h-8 rounded text-xs font-medium transition ${
                i === currentIndex
                  ? "bg-orange-500 text-white"
                  : answers[i] !== null
                  ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <BlurFade key={currentIndex}>
          <div className="h-full">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground capitalize">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <p className="text-foreground font-medium mb-4">
                {currentIndex + 1}. {currentQuestion.questionText}
              </p>

              <div className="space-y-2">
                {currentQuestion.options.map((option, j) => (
                  <button
                    key={j}
                    onClick={() => handleSelectAnswer(j)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                      answers[currentIndex] === j
                        ? "border-orange-500 bg-orange-500/10 text-foreground"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + j)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => navigateQuestion(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition disabled:opacity-30"
          >
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => navigateQuestion(currentIndex + 1)}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition"
            >
              Submit Exam
            </button>
          )}
        </div>

        {/* Confirm Submit Dialog */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl border border-border bg-card p-6 max-w-sm w-full mx-4 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Submit Exam?</h3>
              <p className="text-sm text-muted-foreground">
                You have answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length &&
                  ` ${questions.length - answeredCount} unanswered questions will be marked incorrect.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    submitExam();
                  }}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switch Warning Overlay */}
        {tabWarning && proctored && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="rounded-xl border-2 border-red-500 bg-card p-6 max-w-md w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <ShieldIcon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-500">Warning: Tab Switch Detected!</h3>
                  <p className="text-xs text-muted-foreground">Proctored Mode Active</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                You cannot leave this window during a proctored exam. Switching tabs or windows is not allowed.
              </p>
              <p className="text-sm text-muted-foreground">
                Violations: <span className="font-bold text-red-500">{tabViolationCount.current}/3</span> — After 3 violations, your exam will be auto-submitted.
              </p>
              <button
                onClick={() => setTabWarning(false)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:opacity-90 transition"
              >
                I Understand — Continue Exam
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Exit Warning */}
        {fullscreenWarning && proctored && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="rounded-xl border-2 border-yellow-500 bg-card p-6 max-w-md w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <ShieldIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">Fullscreen Required</h3>
                  <p className="text-xs text-muted-foreground">Proctored Mode Active</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                You must remain in fullscreen mode during a proctored exam. Please return to fullscreen to continue.
              </p>
              <button
                onClick={() => {
                  document.documentElement.requestFullscreen().then(() => {
                    setFullscreenWarning(false);
                  }).catch(() => {
                    toast.error("Fullscreen request blocked by browser. Try pressing F11.");
                  });
                }}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── COMPLETE PHASE ──
  if (phase === "complete" && examResult) {
    return (
      <ExamResults
        questions={examResult.questions}
        responses={examResult.responses}
        score={examResult.score}
        totalQuestions={examResult.totalQuestions}
        timeTaken={examResult.timeTaken}
        duration={examResult.duration}
        onRetake={() => {
          // Re-use same questions
          setAnswers(new Array(questions.length).fill(null));
          timeSpentRef.current = new Array(questions.length).fill(0);
          setCurrentIndex(0);
          setTimeLeft(duration * 60);
          questionStartRef.current = Date.now();
          setExamResult(null);
          setPhase("active");
        }}
        onBackToSetup={() => {
          setQuestions([]);
          setAnswers([]);
          setExamResult(null);
          setPhase("setup");
        }}
      />
    );
  }

  return null;
}
