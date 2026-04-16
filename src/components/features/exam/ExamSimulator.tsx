"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Shield,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Maximize,
  Loader2,
  GraduationCap,
} from "lucide-react";
import ExamResults from "./ExamResults";
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
  const [examId, setExamId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
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
  const isSubmittingRef = useRef(false);

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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      const res = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          studyPackId: selectedPackId,
          responses,
          duration,
          timeTaken: totalTime,
          proctored,
        }),
      });
      if (!res.ok) setSubmitError(true);
    } catch {
      setSubmitError(true);
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
      setExamId(data.examId ?? null);
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
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    timeSpentRef.current[currentIndex] =
      (timeSpentRef.current[currentIndex] || 0) + elapsed;
    questionStartRef.current = Date.now();
    setCurrentIndex(index);
  }

  const difficultyColors = {
    easy: {
      active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      inactive: "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
    },
    medium: {
      active: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      inactive: "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
    },
    hard: {
      active: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      inactive: "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
    },
    mixed: {
      active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      inactive: "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
    },
  };

  // ── SETUP PHASE ──
  if (phase === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto"
      >
        <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
          {/* Subtle bg wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />

          <div className="p-6 space-y-5 relative">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 shadow-[0_0_12px_oklch(0.76_0.17_62_/_15%)]">
                <GraduationCap className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground leading-tight">Configure Your Exam</h2>
                <p className="text-[12px] text-muted-foreground">AI-generated questions from your material</p>
              </div>
            </div>

            {/* Study Pack */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Study Pack
              </label>
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["easy", "medium", "hard", "mixed"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`rounded-xl border px-2 py-2 text-[12.5px] font-semibold capitalize transition-all ${
                      difficulty === d
                        ? difficultyColors[d].active
                        : difficultyColors[d].inactive
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Questions{" "}
                <span className="text-amber-500 font-bold normal-case text-[12px]">{questionCount}</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground/50">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duration{" "}
                <span className="text-amber-500 font-bold normal-case text-[12px]">{duration} min</span>
              </label>
              <input
                type="range"
                min={5}
                max={180}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground/50">
                <span>5 min</span>
                <span>180 min</span>
              </div>
            </div>

            {/* Proctored Toggle */}
            <div
              className={`rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                proctored
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <Shield
                className={`h-5 w-5 shrink-0 transition-colors ${
                  proctored ? "text-amber-500" : "text-muted-foreground"
                }`}
              />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">Proctored Mode</p>
                <p className="text-xs text-muted-foreground">
                  Fullscreen enforced · auto-submit on violation
                </p>
              </div>
              <button
                onClick={() => setProctored(!proctored)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  proctored ? "bg-amber-500" : "bg-muted-foreground/25"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    proctored ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedPackId || isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Exam…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  Generate &amp; Start Exam
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── ACTIVE PHASE ──
  if (phase === "active" && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const answeredCount = answers.filter((a) => a !== null).length;
    const isTimeWarning = timeLeft < 60;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header bar: timer + progress */}
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-[13px] font-medium text-foreground">
              Q {currentIndex + 1}/{questions.length}
            </span>
            <span className="ml-2 text-[11px] text-muted-foreground/60">
              {answeredCount} answered
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 font-mono text-[13px] font-bold transition-colors ${
              isTimeWarning ? "text-red-500 animate-pulse" : "text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question navigation grid */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => navigateQuestion(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  i === currentIndex
                    ? "bg-amber-500 text-white shadow-[0_2px_6px_oklch(0.76_0.17_62_/_30%)]"
                    : answers[i] !== null
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                    : "bg-muted/40 text-muted-foreground/60 border border-border/40 hover:border-border hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            {/* Difficulty badge + question number */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-0.5 rounded-md bg-muted/40 border border-border/40 capitalize">
                {currentQuestion.difficulty}
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Question {currentIndex + 1}
              </span>
            </div>

            <p className="text-[15px] font-semibold text-foreground leading-relaxed mb-5">
              {currentQuestion.questionText}
            </p>

            <div className="space-y-2.5">
              {currentQuestion.options.map((option, j) => {
                const isSelected = answers[currentIndex] === j;
                const letter = String.fromCharCode(65 + j);
                return (
                  <button
                    key={j}
                    onClick={() => handleSelectAnswer(j)}
                    className={`w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 text-[13.5px] transition-all ${
                      isSelected
                        ? "border-amber-500/40 bg-amber-500/8"
                        : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-muted border border-border/50 text-muted-foreground"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="pt-0.5">{option}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation row */}
        <div className="flex gap-3">
          <button
            onClick={() => navigateQuestion(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted/50 transition disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => navigateQuestion(currentIndex + 1)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition"
            >
              Submit Exam
            </button>
          )}
        </div>

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-2xl border border-border bg-card p-6 max-w-sm w-full mx-4 space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">Submit Exam?</h3>
              <p className="text-sm text-muted-foreground">
                You have answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length &&
                  ` ${questions.length - answeredCount} unanswered questions will be marked incorrect.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 rounded-xl border border-border/60 bg-muted/30 text-foreground text-sm font-medium hover:bg-muted/50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    submitExam();
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Warning Overlay */}
        {tabWarning && proctored && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-2xl border-2 border-red-500/60 bg-card p-6 max-w-md w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
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
                Violations:{" "}
                <span className="font-bold text-red-500">{tabViolationCount.current}/3</span>{" "}
                — After 3 violations, your exam will be auto-submitted.
              </p>
              <button
                onClick={() => setTabWarning(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:opacity-90 transition"
              >
                I Understand — Continue Exam
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Warning Overlay */}
        {fullscreenWarning && proctored && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-2xl border-2 border-amber-500/60 bg-card p-6 max-w-md w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Maximize className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-500">Fullscreen Required</h3>
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
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition"
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
      <>
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            Your exam results could not be saved. The score shown below is based on your local answers.
          </div>
        )}
        <ExamResults
        questions={examResult.questions}
        responses={examResult.responses}
        score={examResult.score}
        totalQuestions={examResult.totalQuestions}
        timeTaken={examResult.timeTaken}
        duration={examResult.duration}
        onRetake={() => {
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
      </>
    );
  }

  return null;
}
