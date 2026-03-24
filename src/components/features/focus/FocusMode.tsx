"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import ShimmerButton from "@/components/ui/shimmer-button";
import { SparklesText } from "@/components/ui/sparkles-text";
import { GlowingStarsBackgroundCard } from "@/components/ui/glowing-stars-card";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import CustomSelect from "@/components/ui/custom-select";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface FocusModeProps {
  studyPacks: StudyPackOption[];
}

type Phase = "setup" | "active" | "complete";
type PomodoroPhase = "work" | "shortBreak" | "longBreak";

interface RecentSession {
  _id: string;
  duration: number;
  goals: string[];
  completedGoals: number[];
  completedAt: string | null;
  createdAt: string;
  sessionsCompleted: number;
}

const SESSIONS_BEFORE_LONG_BREAK = 4;

// ── Icons ─────────────────────────────────────────────

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function FocusReadyIcon() {
  return (
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15">
      <svg className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Duration Preset Card ──────────────────────────────

function DurationCard({
  value,
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border px-5 py-3 transition-all ${
        active
          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
          : "border-border bg-muted/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      }`}
    >
      <TimerIcon className="h-5 w-5" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-60">{label}</span>
    </button>
  );
}

// ── SVG Timer ─────────────────────────────────────────

function SVGTimer({
  secondsLeft,
  totalSeconds,
  color,
}: {
  secondsLeft: number;
  totalSeconds: number;
  color: string;
}) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="120" cy="120" r={radius} fill="none" className="stroke-muted-foreground/20" strokeWidth="6" />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 120 120)"
          filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <text
          x="120"
          y="120"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="text-foreground"
          fontSize="40"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {timeStr}
        </text>
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export default function FocusMode({ studyPacks }: FocusModeProps) {
  const [phase, setPhase] = useState<Phase>("setup");

  // Panels
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Setup state
  const [selectedPackId, setSelectedPackId] = useState("");
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [rounds, setRounds] = useState(4);
  const [goals, setGoals] = useState<string[]>([""]);

  // Active state
  const [sessionId, setSessionId] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set());
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("work");
  const [workSessionCount, setWorkSessionCount] = useState(1);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  // Complete state
  const [recap, setRecap] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTransitioning = useRef(false);

  // Active preset index (which duration card is selected)
  const [activePreset, setActivePreset] = useState(0);
  const presets = [
    { value: `${workDuration}m`, label: "Work", minutes: workDuration },
    { value: `${shortBreakDuration}m`, label: "Short Break", minutes: shortBreakDuration },
    { value: String(rounds), label: "Rounds", minutes: 0 },
    { value: `${longBreakDuration}m`, label: "Long Break", minutes: longBreakDuration },
  ];

  // Fetch recent sessions
  const fetchRecentSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/focus-sessions");
      if (res.ok) {
        const data = await res.json();
        setRecentSessions((data.focusSessions || []).slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  function toggleHistory() {
    if (!showHistory) {
      fetchRecentSessions();
      setShowSettings(false);
    }
    setShowHistory((prev) => !prev);
  }

  function toggleSettings() {
    if (!showSettings) {
      setShowHistory(false);
    }
    setShowSettings((prev) => !prev);
  }

  // Pomodoro logic
  const startPomodoroPhase = useCallback(
    (newPhase: PomodoroPhase) => {
      let durationMinutes: number;
      switch (newPhase) {
        case "work":
          durationMinutes = workDuration;
          break;
        case "shortBreak":
          durationMinutes = shortBreakDuration;
          break;
        case "longBreak":
          durationMinutes = longBreakDuration;
          break;
      }
      const secs = durationMinutes * 60;
      setPomodoroPhase(newPhase);
      setSecondsLeft(secs);
      setTotalSeconds(secs);
    },
    [workDuration, shortBreakDuration, longBreakDuration]
  );

  const transitionPhase = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 600);

    if (pomodoroPhase === "work") {
      const newCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newCompleted);

      if (newCompleted % rounds === 0) {
        toast.info("Great work! Time for a long break.");
        startPomodoroPhase("longBreak");
      } else {
        toast.info("Work session done! Take a short break.");
        startPomodoroPhase("shortBreak");
      }
    } else {
      const nextWork = pomodoroPhase === "longBreak" ? 1 : workSessionCount + 1;
      setWorkSessionCount(nextWork);
      toast.info("Break over! Time to focus.");
      startPomodoroPhase("work");
    }

    setTimeout(() => {
      isTransitioning.current = false;
    }, 100);
  }, [pomodoroPhase, sessionsCompleted, workSessionCount, rounds, startPomodoroPhase]);

  const completeSession = useCallback(() => {
    setPhase("complete");
  }, []);

  useEffect(() => {
    if (phase !== "active" || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => transitionPhase(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, secondsLeft, transitionPhase]);

  function updateGoal(index: number, value: string) {
    setGoals((prev) => prev.map((g, i) => (i === index ? value : g)));
  }

  function toggleGoalComplete(index: number) {
    setCompletedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function startSession() {
    const validGoals = goals.filter((g) => g.trim());
    if (!selectedPackId) {
      toast.error("Please select a study pack.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: selectedPackId,
          duration: workDuration,
          goals: validGoals.length > 0 ? validGoals : ["Focus session"],
          workDuration,
          shortBreakDuration,
          longBreakDuration,
        }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      setSessionId(data.focusSession?._id || data._id || data.id);
      setCompletedGoals(new Set());
      setSessionsCompleted(0);
      setWorkSessionCount(1);
      startPomodoroPhase("work");
      setPhase("active");
    } catch {
      toast.error("Failed to start focus session.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRecap() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/focus-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recap,
          completedGoals: Array.from(completedGoals),
          sessionsCompleted,
        }),
      });

      if (!res.ok) throw new Error("Failed to save recap");

      toast.success("Focus session completed!");
      setPhase("setup");
      setSelectedPackId("");
      setWorkDuration(25);
      setShortBreakDuration(5);
      setLongBreakDuration(15);
      setRounds(4);
      setGoals([""]);
      setRecap("");
      setSessionId("");
    } catch {
      toast.error("Failed to save recap.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const validGoals = goals.filter((g) => g.trim());

  function phaseLabel(p: PomodoroPhase, ws: number): string {
    switch (p) {
      case "work":
        return `Work ${ws}/${rounds}`;
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
    }
  }

  function phaseColor(p: PomodoroPhase): string {
    switch (p) {
      case "work":
        return "#f97316";
      case "shortBreak":
        return "#22c55e";
      case "longBreak":
        return "#a855f7";
    }
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " - " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  // ── Setup Phase ──────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="relative mx-auto max-w-2xl space-y-0 overflow-hidden">
        <AnimatedGridPattern className="absolute inset-0 opacity-[0.08] pointer-events-none" numSquares={20} duration={4} />
        {/* ── Header ────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSettings}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors transition-all duration-200 hover:scale-105 active:scale-95 ${
                showSettings
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                  : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
              title="Pomodoro Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={toggleHistory}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors transition-all duration-200 hover:scale-105 active:scale-95 ${
                showHistory
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                  : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
              title="Recent Sessions"
            >
              <HistoryIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Recent Sessions Panel ────────────────────── */}
        {showHistory && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Sessions</h3>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : recentSessions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No sessions yet</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => {
                  const isCompleted = !!s.completedAt;
                  const goalsDone = s.completedGoals?.length || 0;
                  const totalGoals = s.goals?.length || 0;
                  const pct = totalGoals > 0 ? Math.round((goalsDone / totalGoals) * 100) : 0;

                  return (
                    <div
                      key={s._id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3"
                    >
                      {/* Progress circle */}
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(71,85,105,0.4)" strokeWidth="3" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke={isCompleted ? "#4ade80" : "#f97316"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 15}
                            strokeDashoffset={2 * Math.PI * 15 * (1 - (isCompleted ? 1 : pct / 100))}
                            transform="rotate(-90 18 18)"
                          />
                        </svg>
                        <span className="absolute text-[9px] font-bold text-foreground">
                          {isCompleted ? "100" : pct}%
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {s.duration} min session
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isCompleted
                            ? formatSessionTime(s.completedAt!)
                            : `${formatSessionTime(s.createdAt)} - ${goalsDone}/${totalGoals} goals`}
                        </p>
                      </div>

                      {!isCompleted && (
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-medium text-orange-400">
                          In progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Pomodoro Settings Panel ──────────────────── */}
        {showSettings && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Pomodoro Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Work */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Work</label>
                <CustomSelect
                  value={String(workDuration)}
                  onValueChange={(val) => setWorkDuration(Number(val))}
                  options={[15, 20, 25, 30, 35, 40, 45, 50, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} min` }))}
                />
              </div>
              {/* Short Break */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Short Break</label>
                <CustomSelect
                  value={String(shortBreakDuration)}
                  onValueChange={(val) => setShortBreakDuration(Number(val))}
                  options={[3, 5, 10, 15].map((m) => ({ value: String(m), label: `${m} min` }))}
                />
              </div>
              {/* Long Break */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Long Break</label>
                <CustomSelect
                  value={String(longBreakDuration)}
                  onValueChange={(val) => setLongBreakDuration(Number(val))}
                  options={[10, 15, 20, 25, 30].map((m) => ({ value: String(m), label: `${m} min` }))}
                />
              </div>
              {/* Rounds */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Rounds</label>
                <CustomSelect
                  value={String(rounds)}
                  onValueChange={(val) => setRounds(Number(val))}
                  options={[2, 3, 4, 5, 6, 8].map((r) => ({ value: String(r), label: `${r} rounds` }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ─────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card px-6 py-10">
          <div className="text-center">
            <FocusReadyIcon />
            <h2 className="text-xl font-bold text-foreground">Ready to focus?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick a study pack and dive in</p>
          </div>

          {/* Study pack select */}
          <div className="mx-auto mt-6 max-w-sm">
            <CustomSelect
              value={selectedPackId}
              onValueChange={setSelectedPackId}
              options={[
                { value: "", label: "Select study pack" },
                ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
              ]}
              placeholder="Select a study pack..."
            />
          </div>

          {/* Duration preset cards */}
          <div className="mx-auto mt-6 grid max-w-md grid-cols-4 gap-3">
            {presets.map((p, i) => (
              <DurationCard
                key={p.label}
                value={p.value}
                label={p.label}
                active={activePreset === i}
                onClick={() => setActivePreset(i)}
              />
            ))}
          </div>

          {/* Start button */}
          <div className="mx-auto mt-8 max-w-sm flex justify-center">
            <ShimmerButton onClick={startSession} className="px-8 py-3 text-base font-semibold rounded-2xl min-w-[140px]">
              <PlayIcon className="h-4 w-4" />
              {isSubmitting ? "Starting..." : "Start Focus Session"}
            </ShimmerButton>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Phase ─────────────────────────────────────

  if (phase === "active") {
    const color = phaseColor(pomodoroPhase);

    return (
      <div className="mx-auto max-w-2xl">
            {/* Phase progress dots */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: rounds }).map((_, i) => {
              const isActive = i < sessionsCompleted % rounds ||
                (pomodoroPhase === "work" && i < workSessionCount - 1);
              return (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-colors ${!isActive ? "bg-border" : ""}`}
                  style={isActive ? { backgroundColor: color } : undefined}
                />
              );
            })}
          </div>

          <div className="mt-3 text-center text-sm font-medium" style={{ color }}>
            {phaseLabel(pomodoroPhase, workSessionCount)}
          </div>

          {/* Timer */}
          <div className="my-6">
            <SVGTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} color={color} />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {sessionsCompleted} pomodoro{sessionsCompleted !== 1 ? "s" : ""} completed
          </div>

          {/* Goals */}
          {validGoals.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-foreground">Goals</h3>
              {validGoals.map((goal, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleGoalComplete(idx)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    completedGoals.has(idx)
                      ? "border-green-500/30 bg-green-500/10 text-green-400 line-through"
                      : "border-border bg-muted/40 text-foreground hover:border-foreground/20"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs">
                    {completedGoals.has(idx) ? (
                      <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </span>
                  {goal}
                </button>
              ))}
            </div>
          )}

          {/* End session button */}
          <button
            onClick={completeSession}
            className="mt-6 w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            End Session
          </button>
      </div>
    );
  }

  // ── Complete Phase ───────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl">
      <GlowingStarsBackgroundCard className="w-full max-w-none max-h-none h-auto">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <SparklesText text="Session Complete!" className="text-2xl font-bold text-amber-400" />
          <p className="mt-1 text-sm text-muted-foreground">
            You completed {sessionsCompleted} pomodoro{sessionsCompleted !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Goals summary */}
        {validGoals.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Goals Summary</h3>
            {validGoals.map((goal, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  completedGoals.has(idx)
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs">
                  {completedGoals.has(idx) ? (
                    <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
                {goal}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {completedGoals.size} of {validGoals.length} goals completed
            </p>
          </div>
        )}

        {/* Recap */}
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-foreground">Session Recap</label>
          <textarea
            value={recap}
            onChange={(e) => setRecap(e.target.value)}
            placeholder="What did you accomplish? What do you want to focus on next?"
            rows={4}
            className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
          />
        </div>

        <button
          onClick={submitRecap}
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save & Finish"}
        </button>
      </GlowingStarsBackgroundCard>
    </div>
  );
}
