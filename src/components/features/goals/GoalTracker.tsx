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
import { SlideButton } from "@/components/ui/slide-button";
import BlurFade from "@/components/ui/blur-fade";
import ShimmerButton from "@/components/ui/shimmer-button";
import { AnimatedGenerateButton } from "@/components/ui/animated-generate-button";
import TextShimmer from "@/components/ui/text-shimmer";
import { differenceInDays } from "date-fns";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  const renderGoalCard = (goal: Goal, index: number) => {
    const progress = getProgress(goal);
    const daysLeft = goal.deadline
      ? differenceInDays(new Date(goal.deadline), new Date())
      : null;

    return (
      <BlurFade key={goal._id} delay={0.05 * index}>
      <div
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
            <AnimatedGenerateButton
              isLoading={suggestingId === goal._id}
              idleLabel="Get AI Tip"
              loadingLabel="Thinking..."
              onClick={() => getAiSuggestion(goal._id)}
              disabled={suggestingId === goal._id}
              className="mt-0"
            />
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
      </BlurFade>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <SlideButton onClick={refreshProgress} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Progress
        </SlideButton>
        <ShimmerButton onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Goal"}
        </ShimmerButton>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createGoal} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Input
            type="text"
            placeholder="Goal title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomSelect
              value={targetType}
              onValueChange={setTargetType}
              options={Object.entries(targetTypeLabels).map(([val, label]) => ({ value: val, label }))}
            />
            <Input
              type="number"
              placeholder="Target value"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              min="1"
              required
            />
            <DatePicker
              value={deadline}
              onChange={setDeadline}
              placeholder="Deadline (optional)"
            />
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
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
          <TextShimmer className="text-lg font-semibold">Active Goals ({active.length})</TextShimmer>
        </h2>
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Target className="h-6 w-6 text-orange-400/60" />
            </div>
            <p className="text-sm font-medium text-foreground/70">No active goals</p>
            <p className="mt-1 text-xs text-muted-foreground">Set a goal above to start tracking your progress!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((g, i) => renderGoalCard(g, i))}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
            <Trophy className="h-5 w-5 text-green-500" />
            <TextShimmer className="text-lg font-semibold">Completed Goals ({completed.length})</TextShimmer>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completed.map((g, i) => renderGoalCard(g, i))}
          </div>
        </div>
      )}

      {/* Abandoned Goals */}
      {abandoned.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            <TextShimmer className="text-sm font-semibold">Abandoned ({abandoned.length})</TextShimmer>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {abandoned.map((g, i) => renderGoalCard(g, i))}
          </div>
        </div>
      )}
    </div>
  );
}
