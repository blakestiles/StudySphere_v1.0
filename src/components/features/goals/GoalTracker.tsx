"use client";

import { useState } from "react";
import {
  Plus, Trash2, RefreshCw, Sparkles, Trophy,
  Target, X, Loader2, Ban, CalendarClock, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { differenceInDays } from "date-fns";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";

interface Goal {
  _id: string;
  title: string;
  description: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
  deadline?: string;
  status: string;
  aiSuggestion: string;
  createdAt: string;
}

interface GoalTrackerProps {
  goals: Goal[];
  studyPacks: { _id: string; title: string }[];
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  flashcards_reviewed: "Flashcards Reviewed",
  quiz_score: "Quiz Score %",
  study_minutes: "Study Minutes",
  essays_written: "Essays Written",
  packs_completed: "Packs Completed",
  custom: "Custom",
};

// ── Deadline chip ──────────────────────────────────────

function DeadlineChip({ deadline, status }: { deadline: string; status: string }) {
  if (status !== "active") return null;
  const days = differenceInDays(new Date(deadline), new Date());
  const cls =
    days < 0
      ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
      : days <= 3
      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
      : "bg-muted/40 border-border/40 text-muted-foreground";
  const label =
    days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`;
  return (
    <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${cls}`}>
      <CalendarClock className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Goal Card ──────────────────────────────────────────

function GoalCard({
  goal,
  index,
  suggestingId,
  onGetAiTip,
  onUpdateStatus,
  onDelete,
}: {
  goal: Goal;
  index: number;
  suggestingId: string | null;
  onGetAiTip: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const progress =
    goal.targetValue === 0 ? 0 : Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

  const isActive = goal.status === "active";
  const isCompleted = goal.status === "completed";

  const statusPill = isActive
    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
    : isCompleted
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    : "bg-muted/40 border-border/40 text-muted-foreground";

  const barColor = isActive
    ? "bg-gradient-to-r from-amber-500 to-orange-400"
    : isCompleted
    ? "bg-emerald-500"
    : "bg-muted-foreground/30";

  const leftAccent = isActive
    ? "border-l-amber-500/50"
    : isCompleted
    ? "border-l-emerald-500/50"
    : "border-l-border/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border border-border/60 border-l-2 bg-card p-4 space-y-3 ${leftAccent}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[13.5px] font-semibold text-foreground">{goal.title}</h3>
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusPill}`}>
              {goal.status}
            </span>
            {goal.deadline && <DeadlineChip deadline={goal.deadline} status={goal.status} />}
          </div>
          {goal.description && (
            <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">{goal.description}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal._id)}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/70">{TARGET_TYPE_LABELS[goal.targetType] ?? goal.targetType}</span>
          <span className="font-semibold text-foreground">
            {goal.currentValue}/{goal.targetValue}
            {goal.targetType === "quiz_score" ? "%" : ""}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 + 0.1 }}
          />
        </div>
        <div className="flex justify-end">
          <span className={`text-[11px] font-bold ${
            progress === 100
              ? "text-emerald-600 dark:text-emerald-400"
              : isActive
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* AI suggestion */}
      <AnimatePresence>
        {goal.aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400">AI Tip</span>
              </div>
              <p className="text-[12px] leading-relaxed text-foreground/80">{goal.aiSuggestion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => onGetAiTip(goal._id)}
            disabled={suggestingId === goal._id}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {suggestingId === goal._id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Sparkles className="h-3 w-3" />
            }
            {suggestingId === goal._id ? "Thinking…" : "AI Tip"}
          </button>
          <button
            onClick={() => onUpdateStatus(goal._id, "completed")}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-all"
          >
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </button>
          <button
            onClick={() => onUpdateStatus(goal._id, "abandoned")}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-all ml-auto"
          >
            <Ban className="h-3 w-3" />
            Abandon
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Section header ─────────────────────────────────────

function SectionHeader({ icon: Icon, label, count, iconClass }: {
  icon: React.ElementType; label: string; count: number; iconClass: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${iconClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="ml-1 rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{count}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────

export default function GoalTracker({ goals: initial }: GoalTrackerProps) {
  const [goals, setGoals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("flashcards_reviewed");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const abandoned = goals.filter((g) => g.status === "abandoned");

  const refreshProgress = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/goals/progress");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals);
        toast.success("Progress updated");
      }
    } catch {
      toast.error("Failed to refresh progress");
    } finally {
      setRefreshing(false);
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;
    setCreating(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          targetType,
          targetValue: Number(targetValue),
          deadline: deadline || undefined,
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => [data.goal, ...prev]);
        setShowForm(false);
        setTitle(""); setTargetType("flashcards_reviewed");
        setTargetValue(""); setDeadline(""); setDescription("");
        toast.success("Goal created");
      }
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((g) => g._id !== id));
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => prev.map((g) => (g._id === id ? data.goal : g)));
        toast.success(`Goal marked as ${status}`);
      }
    } catch {
      toast.error("Failed to update goal");
    }
  };

  const getAiSuggestion = async (id: string) => {
    setSuggestingId(id);
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestSuggestion: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => prev.map((g) => (g._id === id ? data.goal : g)));
      }
    } catch {
      toast.error("Failed to get AI suggestion");
    } finally {
      setSuggestingId(null);
    }
  };

  const sharedCardProps = {
    suggestingId,
    onGetAiTip: getAiSuggestion,
    onUpdateStatus: updateStatus,
    onDelete: deleteGoal,
  };

  return (
    <div className="space-y-5">
      {/* ── Stats summary ──────────────────────────────── */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: "Active", count: active.length, cls: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
            { icon: Trophy, label: "Completed", count: completed.length, cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
            { icon: Ban, label: "Abandoned", count: abandoned.length, cls: "bg-muted/40 border-border/40 text-muted-foreground" },
          ].map(({ icon: Icon, label, count, cls }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cls}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold font-display text-foreground leading-none">{count}</p>
                <p className="text-[10.5px] text-muted-foreground/60 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={refreshProgress}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-muted/40 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 transition-all"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Goal"}
        </button>
      </div>

      {/* ── Create form ────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={createGoal}
              className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />
              <div className="relative p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Target className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">New Goal</span>
                </div>
                <input
                  type="text"
                  placeholder="Goal title…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CustomSelect
                    value={targetType}
                    onValueChange={setTargetType}
                    options={Object.entries(TARGET_TYPE_LABELS).map(([val, label]) => ({ value: val, label }))}
                  />
                  <input
                    type="number"
                    placeholder="Target value"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    min="1"
                    required
                    className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                  <DatePicker
                    value={deadline}
                    onChange={setDeadline}
                    placeholder="Deadline (optional)"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  Create Goal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Goals ───────────────────────────────── */}
      <div>
        <SectionHeader
          icon={Target}
          label="Active Goals"
          count={active.length}
          iconClass="bg-amber-500/10 border border-amber-500/20 text-amber-500"
        />
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Target className="h-6 w-6 text-amber-500/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No active goals</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Create a goal above to start tracking your progress.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {active.map((g, i) => <GoalCard key={g._id} goal={g} index={i} {...sharedCardProps} />)}
          </div>
        )}
      </div>

      {/* ── Completed Goals ────────────────────────────── */}
      {completed.length > 0 && (
        <div>
          <SectionHeader
            icon={Trophy}
            label="Completed"
            count={completed.length}
            iconClass="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {completed.map((g, i) => <GoalCard key={g._id} goal={g} index={i} {...sharedCardProps} />)}
          </div>
        </div>
      )}

      {/* ── Abandoned Goals ────────────────────────────── */}
      {abandoned.length > 0 && (
        <div>
          <SectionHeader
            icon={Ban}
            label="Abandoned"
            count={abandoned.length}
            iconClass="bg-muted/40 border border-border/40 text-muted-foreground"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {abandoned.map((g, i) => <GoalCard key={g._id} goal={g} index={i} {...sharedCardProps} />)}
          </div>
        </div>
      )}
    </div>
  );
}
