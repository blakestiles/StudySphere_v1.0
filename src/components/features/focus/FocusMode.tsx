"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Settings, History, Timer, CheckCircle2, Circle,
  ChevronDown, Plus, X, Loader2, Trophy, Coffee, Zap, Headphones, Volume2, VolumeX,
} from "lucide-react";
import CustomSelect from "@/components/ui/custom-select";

interface StudyPackOption { _id: string; title: string }
interface FocusModeProps { studyPacks: StudyPackOption[] }
type Phase = "setup" | "active" | "complete";
type PomodoroPhase = "work" | "shortBreak" | "longBreak";
interface RecentSession {
  _id: string; duration: number; goals: string[];
  completedGoals: number[]; completedAt: string | null;
  createdAt: string; sessionsCompleted: number;
}

/* ── SVG Ring Timer ─────────────────────────────────── */

function RingTimer({ secondsLeft, totalSeconds, color }: { secondsLeft: number; totalSeconds: number; color: string }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ * (secondsLeft / (totalSeconds || 1));
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-sm">
      <defs>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="110" cy="110" r={r} fill="none" strokeWidth="7" className="stroke-muted/60" />
      {/* Progress — counts down */}
      <circle
        cx="110" cy="110" r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ - offset}
        transform="rotate(-90 110 110)"
        filter="url(#ring-glow)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      {/* Time */}
      <text x="110" y="105" textAnchor="middle" dominantBaseline="middle"
        fill="currentColor" className="fill-foreground"
        fontSize="38" fontWeight="700" fontFamily="monospace">
        {mm}:{ss}
      </text>
    </svg>
  );
}

/* ── Phase dot row ──────────────────────────────────── */
function PhaseDots({ rounds, sessionsCompleted, pomodoroPhase, workSessionCount, color }: {
  rounds: number; sessionsCompleted: number; pomodoroPhase: PomodoroPhase; workSessionCount: number; color: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: rounds }).map((_, i) => {
        const done = pomodoroPhase === "work"
          ? i < workSessionCount - 1
          : i < sessionsCompleted % rounds || (sessionsCompleted % rounds === 0 && sessionsCompleted > 0 && i < rounds);
        return (
          <div
            key={i}
            className="h-1.5 w-7 rounded-full transition-all duration-500"
            style={{ backgroundColor: done ? color : undefined }}
            data-inactive={!done || undefined}
          />
        );
      })}
      <style>{`[data-inactive] { background-color: oklch(var(--muted-foreground) / 0.2); }`}</style>
    </div>
  );
}

/* ── Format helpers ─────────────────────────────────── */
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " +
    new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ── Lo-Fi Player ───────────────────────────────────── */
function LoFiPlayer({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-300 ${
            on
              ? "bg-violet-500/15 border-violet-500/30 text-violet-500"
              : "bg-muted/40 border-border/50 text-muted-foreground"
          }`}>
            <Headphones className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-none">Lo-Fi Beats</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              {on ? "Playing · Lofi Girl 24/7" : "Concentration music"}
            </p>
          </div>
          {on && (
            <motion.div
              className="flex items-end gap-[3px] h-4 ml-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-violet-500"
                  animate={{ height: ["6px", "14px", "6px"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            on
              ? "bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20"
              : "bg-gradient-to-br from-violet-500 to-purple-600 border-transparent text-white shadow-[0_2px_8px_oklch(0.55_0.2_293_/_30%)] hover:opacity-90"
          }`}
        >
          {on ? <><VolumeX className="h-3 w-3" /> Stop</> : <><Volume2 className="h-3 w-3" /> Play</>}
        </button>
      </div>

      {/* YouTube iframe — must stay visible per YouTube ToS */}
      <AnimatePresence>
        {on && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
                <iframe
                  src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&rel=0&modestbranding=1"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-xl"
                  title="Lo-Fi Beats — Lofi Girl 24/7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                Lofi Girl 24/7 · Music continues while you work
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function FocusMode({ studyPacks }: FocusModeProps) {
  const [phase, setPhase] = useState<Phase>("setup");

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Setup
  const [selectedPackId, setSelectedPackId] = useState("");
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [rounds, setRounds] = useState(4);
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");

  // Active
  const [sessionId, setSessionId] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set());
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("work");
  const [workSessionCount, setWorkSessionCount] = useState(1);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Complete
  const [recap, setRecap] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Music
  const [musicOn, setMusicOn] = useState(false);

  const isTransitioning = useRef(false);

  const fetchRecentSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/focus-sessions");
      if (res.ok) {
        const data = await res.json();
        setRecentSessions((data.focusSessions || []).slice(0, 5));
      }
    } catch { /* silent */ }
    finally { setLoadingSessions(false); }
  }, []);

  function addGoal() {
    if (!goalInput.trim()) return;
    setGoals((prev) => [...prev, goalInput.trim()]);
    setGoalInput("");
  }

  function removeGoal(i: number) {
    setGoals((prev) => prev.filter((_, idx) => idx !== i));
  }

  const startPomodoroPhase = useCallback((np: PomodoroPhase) => {
    const d = np === "work" ? workDuration : np === "shortBreak" ? shortBreakDuration : longBreakDuration;
    const secs = d * 60;
    setPomodoroPhase(np);
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  }, [workDuration, shortBreakDuration, longBreakDuration]);

  const transitionPhase = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    if (pomodoroPhase === "work") {
      const nc = sessionsCompleted + 1;
      setSessionsCompleted(nc);
      if (nc % rounds === 0) { toast.info("Long break time!"); startPomodoroPhase("longBreak"); }
      else { toast.info("Short break — good work!"); startPomodoroPhase("shortBreak"); }
    } else {
      const nw = pomodoroPhase === "longBreak" ? 1 : workSessionCount + 1;
      setWorkSessionCount(nw);
      toast.info("Back to focus!");
      startPomodoroPhase("work");
    }
    setTimeout(() => { isTransitioning.current = false; }, 100);
  }, [pomodoroPhase, sessionsCompleted, workSessionCount, rounds, startPomodoroPhase]);

  useEffect(() => {
    if (phase !== "active" || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(t); setTimeout(transitionPhase, 0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, secondsLeft, transitionPhase]);

  async function startSession() {
    if (!selectedPackId) { toast.error("Please select a study pack."); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackId: selectedPackId,
          duration: workDuration,
          goals: goals.length > 0 ? goals : ["Focus session"],
          workDuration, shortBreakDuration, longBreakDuration,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionId(data.focusSession?._id || data._id || data.id);
      setCompletedGoals(new Set());
      setSessionsCompleted(0);
      setWorkSessionCount(1);
      startPomodoroPhase("work");
      setPhase("active");
    } catch { toast.error("Failed to start focus session."); }
    finally { setIsSubmitting(false); }
  }

  async function submitRecap() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/focus-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recap, completedGoals: Array.from(completedGoals), sessionsCompleted }),
      });
      if (!res.ok) throw new Error();
      toast.success("Focus session saved!");
      setPhase("setup");
      setSelectedPackId(""); setWorkDuration(25); setShortBreakDuration(5);
      setLongBreakDuration(15); setRounds(4); setGoals([]); setGoalInput(""); setRecap(""); setSessionId("");
    } catch { toast.error("Failed to save recap."); }
    finally { setIsSubmitting(false); }
  }

  function phaseColor(p: PomodoroPhase) {
    return p === "work" ? "#f97316" : p === "shortBreak" ? "#22c55e" : "#a855f7";
  }

  function phaseLabel(p: PomodoroPhase, ws: number) {
    return p === "work" ? `Work ${ws}/${rounds}` : p === "shortBreak" ? "Short Break" : "Long Break";
  }

  /* ── SETUP ───────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg mx-auto space-y-3"
      >
        {/* Main setup card */}
        <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-orange-500/[0.03] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

          <div className="relative p-6 space-y-5">
            {/* Heading */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-xl" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                    <Timer className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">Ready to focus?</h2>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Pick a pack and set your goals</p>
                </div>
              </div>
              {/* Settings + History toggle buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${showSettings ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
                  title="Timer settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchRecentSessions(); setShowSettings(false); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${showHistory ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
                  title="Session history"
                >
                  <History className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Study pack selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Study Pack</label>
              <CustomSelect
                value={selectedPackId}
                onValueChange={setSelectedPackId}
                options={[
                  { value: "", label: studyPacks.length === 0 ? "No ready packs yet…" : "Select a study pack…" },
                  ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
                ]}
              />
            </div>

            {/* Pomodoro summary chips */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: Zap, label: `${workDuration}m work`, color: "text-amber-600 dark:text-amber-400 bg-amber-500/8 border-amber-500/20" },
                { icon: Coffee, label: `${shortBreakDuration}m break`, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20" },
                { icon: Coffee, label: `${longBreakDuration}m long`, color: "text-violet-600 dark:text-violet-400 bg-violet-500/8 border-violet-500/20" },
                { icon: Timer, label: `${rounds} rounds`, color: "text-muted-foreground bg-muted/50 border-border/50" },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium ${color}`}>
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Session Goals <span className="normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                  placeholder="Add a goal and press Enter…"
                  className="flex-1 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
                <button
                  onClick={addGoal}
                  disabled={!goalInput.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <AnimatePresence>
                {goals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {goals.map((g, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 group"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 shrink-0" />
                        <span className="flex-1 text-sm text-foreground/80">{g}</span>
                        <button onClick={() => removeGoal(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Start button */}
            <button
              onClick={startSession}
              disabled={!selectedPackId || isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
              ) : (
                <><Play className="h-4 w-4 fill-white" /> Start Focus Session</>
              )}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-muted-foreground/60" />
                  <h3 className="text-[13px] font-semibold text-foreground">Timer Settings</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Work", val: String(workDuration), opts: [15,20,25,30,35,40,45,50,60,90,120], set: (v: string) => setWorkDuration(Number(v)) },
                    { label: "Short Break", val: String(shortBreakDuration), opts: [3,5,10,15], set: (v: string) => setShortBreakDuration(Number(v)) },
                    { label: "Long Break", val: String(longBreakDuration), opts: [10,15,20,25,30], set: (v: string) => setLongBreakDuration(Number(v)) },
                    { label: "Rounds", val: String(rounds), opts: [2,3,4,5,6,8], set: (v: string) => setRounds(Number(v)) },
                  ].map(({ label, val, opts, set }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground/60">{label}</label>
                      <CustomSelect
                        value={val}
                        onValueChange={set}
                        options={opts.map((o) => ({ value: String(o), label: label === "Rounds" ? `${o} rounds` : `${o} min` }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lo-Fi music player */}
        <LoFiPlayer on={musicOn} onToggle={() => setMusicOn((v) => !v)} />

        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 text-muted-foreground/60" />
                  <h3 className="text-[13px] font-semibold text-foreground">Recent Sessions</h3>
                </div>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  </div>
                ) : recentSessions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No sessions yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentSessions.map((s) => {
                      const done = s.completedGoals?.length ?? 0;
                      const total = s.goals?.length ?? 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 100;
                      const isCompleted = !!s.completedAt;
                      return (
                        <div key={s._id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                          {/* Ring progress */}
                          <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
                            <circle cx="17" cy="17" r="13" fill="none" strokeWidth="3" className="stroke-muted" />
                            <circle cx="17" cy="17" r="13" fill="none" stroke={isCompleted ? "#22c55e" : "#f97316"}
                              strokeWidth="3" strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 13}
                              strokeDashoffset={2 * Math.PI * 13 * (1 - pct / 100)}
                              transform="rotate(-90 17 17)" />
                            <text x="17" y="17" textAnchor="middle" dominantBaseline="central"
                              fontSize="7" fontWeight="700" fill="currentColor" className="fill-foreground">
                              {pct}%
                            </text>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-medium text-foreground">
                              {s.duration}m session · {s.sessionsCompleted ?? 0} pomodoros
                            </p>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                              {fmtDate(isCompleted ? s.completedAt! : s.createdAt)}
                            </p>
                          </div>
                          {!isCompleted && (
                            <span className="shrink-0 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                              incomplete
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  /* ── ACTIVE ──────────────────────────────────────── */
  if (phase === "active") {
    const color = phaseColor(pomodoroPhase);
    const phaseColors = {
      work: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
      shortBreak: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      longBreak: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25",
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg mx-auto space-y-4"
      >
        {/* Timer card */}
        <div className="relative rounded-2xl border bg-card overflow-hidden" style={{ borderColor: `${color}30` }}>
          {/* Colored top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
          {/* Subtle bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}08 0%, transparent 70%)` }} />

          <div className="relative p-6 space-y-5">
            {/* Phase badge + dots */}
            <div className="flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.span
                  key={pomodoroPhase}
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-semibold ${phaseColors[pomodoroPhase]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  {phaseLabel(pomodoroPhase, workSessionCount)}
                </motion.span>
              </AnimatePresence>

              <PhaseDots
                rounds={rounds}
                sessionsCompleted={sessionsCompleted}
                pomodoroPhase={pomodoroPhase}
                workSessionCount={workSessionCount}
                color={color}
              />
            </div>

            {/* Ring timer */}
            <div className="flex justify-center">
              <RingTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} color={color} />
            </div>

            {/* Pomodoros completed */}
            <p className="text-center text-xs text-muted-foreground/60 tabular-nums">
              {sessionsCompleted} pomodoro{sessionsCompleted !== 1 ? "s" : ""} completed this session
            </p>
          </div>
        </div>

        {/* Goals card */}
        {goals.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Session Goals</h3>
            {goals.map((goal, idx) => {
              const done = completedGoals.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => setCompletedGoals((prev) => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                    return next;
                  })}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[13px] transition-all ${
                    done
                      ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400"
                      : "border-border/50 bg-muted/30 text-foreground hover:border-border"
                  }`}
                >
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  }
                  <span className={done ? "line-through opacity-70" : ""}>{goal}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lo-Fi music player */}
        <LoFiPlayer on={musicOn} onToggle={() => setMusicOn((v) => !v)} />

        {/* End session */}
        <button
          onClick={() => setPhase("complete")}
          className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all"
        >
          End Session Early
        </button>
      </motion.div>
    );
  }

  /* ── COMPLETE ────────────────────────────────────── */
  const completedCount = completedGoals.size;
  const totalGoals = goals.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-lg mx-auto space-y-4"
    >
      {/* Celebration card */}
      <div className="relative rounded-2xl border border-emerald-500/20 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-emerald-500/[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-green-400 to-transparent" />

        <div className="relative p-6 text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/25 mx-auto">
              <Trophy className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Session Complete!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sessionsCompleted} pomodoro{sessionsCompleted !== 1 ? "s" : ""} · {sessionsCompleted * workDuration} minutes of focus
          </p>

          {/* Stats chips */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-medium">
              <Zap className="h-3.5 w-3.5" />
              {sessionsCompleted} pomodoros
            </span>
            {totalGoals > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{totalGoals} goals
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Goals summary */}
      {goals.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Goals Summary</h3>
          {goals.map((goal, idx) => {
            const done = completedGoals.has(idx);
            return (
              <div key={idx} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-[13px] ${
                done
                  ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400"
                  : "border-border/50 bg-muted/20 text-muted-foreground"
              }`}>
                {done
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                }
                <span className={done ? "" : "opacity-60"}>{goal}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recap + save */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Session Recap</h3>
        <textarea
          value={recap}
          onChange={(e) => setRecap(e.target.value)}
          placeholder="What did you accomplish? What will you focus on next?"
          rows={3}
          className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
        />
        <button
          onClick={submitRecap}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_oklch(0.52_0.18_142_/_30%)] hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><CheckCircle2 className="h-4 w-4" /> Save & Finish</>
          }
        </button>
      </div>
    </motion.div>
  );
}
