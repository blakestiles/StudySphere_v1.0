"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Trophy,
  Target,
  X,
  Loader2,
  Ban,
} from "lucide-react";
import { differenceInDays } from "date-fns";
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

const targetTypeLabels: Record<string, string> = {
  flashcards_reviewed: "Flashcards Reviewed",
  quiz_score: "Quiz Score %",
  study_minutes: "Study Minutes",
  essays_written: "Essays Written",
  packs_completed: "Packs Completed",
  custom: "Custom",
};

export default function GoalTracker({ goals: initial }: GoalTrackerProps) {
  const [goals, setGoals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("flashcards_reviewed");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

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
        setTitle("");
        setTargetType("flashcards_reviewed");
        setTargetValue("");
        setDeadline("");
        setDescription("");
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

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const abandoned = goals.filter((g) => g.status === "abandoned");

  const getProgress = (g: Goal) => {
    if (g.targetValue === 0) return 0;
    return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  };

  const renderGoalCard = (goal: Goal) => {
    const progress = getProgress(goal);
    const daysLeft = goal.deadline
      ? differenceInDays(new Date(goal.deadline), new Date())
      : null;

    return (
      <div
        key={goal._id}
        className="rounded-xl border border-border bg-card p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              goal.status === "active"
                ? "bg-blue-500/10 text-blue-500"
                : goal.status === "completed"
                ? "bg-green-500/10 text-green-500"
                : "bg-gray-500/10 text-gray-500"
            }`}
          >
            {goal.status}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{targetTypeLabels[goal.targetType] || goal.targetType}</span>
            <span>
              {goal.currentValue} / {goal.targetValue}
              {goal.targetType === "quiz_score" ? "%" : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-medium text-foreground">{progress}%</span>
            {daysLeft !== null && goal.status === "active" && (
              <span
                className={`text-xs ${
                  daysLeft < 0
                    ? "text-red-500"
                    : daysLeft <= 3
                    ? "text-yellow-500"
                    : "text-muted-foreground"
                }`}
              >
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} days overdue`
                  : daysLeft === 0
                  ? "Due today"
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
        </div>

        {/* AI Suggestion */}
        {goal.aiSuggestion && (
          <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-500">AI Tip</span>
            </div>
            <p className="text-sm text-foreground">{goal.aiSuggestion}</p>
          </div>
        )}

        {/* Actions */}
        {goal.status === "active" && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => getAiSuggestion(goal._id)}
              disabled={suggestingId === goal._id}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-orange-500 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
            >
              {suggestingId === goal._id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Get AI Tip
            </button>
            <button
              onClick={() => updateStatus(goal._id, "abandoned")}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Abandon
            </button>
            <button
              onClick={() => deleteGoal(goal._id)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {goal.status !== "active" && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => deleteGoal(goal._id)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={refreshProgress}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Progress
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Goal"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createGoal} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <input
            type="text"
            placeholder="Goal title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {Object.entries(targetTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Target value"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              min="1"
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Create Goal
          </button>
        </form>
      )}

      {/* Active Goals */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
          <Target className="h-5 w-5 text-blue-500" />
          Active Goals ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active goals. Set one to start tracking!</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map(renderGoalCard)}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
            <Trophy className="h-5 w-5 text-green-500" />
            Completed Goals ({completed.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completed.map(renderGoalCard)}
          </div>
        </div>
      )}

      {/* Abandoned Goals */}
      {abandoned.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            Abandoned ({abandoned.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {abandoned.map(renderGoalCard)}
          </div>
        </div>
      )}
    </div>
  );
}
