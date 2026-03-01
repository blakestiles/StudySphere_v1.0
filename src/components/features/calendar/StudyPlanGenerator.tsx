"use client";

import { useState } from "react";
import { toast } from "sonner";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface StudyPlanGeneratorProps {
  studyPacks: StudyPackOption[];
}

// ── Icons ──────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.82C8 15 11 12 17 8z" />
      <path d="M17 8c2-1 3.5-.5 5 1-2 2.5-3.5 3-5 2.5" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 3v18M3 12l4-4 4 4M13 8l4-4 4 4M3 16l4 4 4-4M13 20l4-4 4 4" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2c.5 4-2 6-2 10a4 4 0 008 0c0-4-2.5-6-2-10M12 12a2 2 0 00-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 00-2-2z" />
    </svg>
  );
}

function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2v4M4.93 10.93l2.83 2.83M2 18h2M20 18h2M16.24 13.76l2.83-2.83M18 22H6M12 18a6 6 0 000-12" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Config ─────────────────────────────────────────────

const INTENSITY_OPTIONS = [
  { value: "relaxed" as const, label: "Relaxed", desc: "Slow, steady pace for long-term retention", icon: LeafIcon, color: "#4ade80" },
  { value: "balanced" as const, label: "Balanced", desc: "Moderate workload for consistent progress", icon: ScaleIcon, color: "#f97316" },
  { value: "intense" as const, label: "Intense", desc: "Maximum coverage before deadline", icon: FlameIcon, color: "#ef4444" },
];

const TIME_OPTIONS = [
  { value: "morning" as const, label: "Morning", desc: "6 AM - 12 PM", icon: SunriseIcon, color: "#fbbf24" },
  { value: "afternoon" as const, label: "Afternoon", desc: "12 PM - 6 PM", icon: SunIcon, color: "#f97316" },
  { value: "evening" as const, label: "Evening", desc: "6 PM - 12 PM", icon: MoonIcon, color: "#818cf8" },
];

const DAILY_TIME_OPTIONS = [
  { value: "30", label: "30 mins" },
  { value: "60", label: "1 Hour" },
  { value: "90", label: "1.5 Hours" },
  { value: "120", label: "2 Hours" },
  { value: "180", label: "3 Hours" },
];

// ── Component ──────────────────────────────────────────

export default function StudyPlanGenerator({ studyPacks }: StudyPlanGeneratorProps) {
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState<"relaxed" | "balanced" | "intense">("balanced");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening">("afternoon");
  const [targetDate, setTargetDate] = useState("");
  const [dailyTime, setDailyTime] = useState("60");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);

  function togglePack(id: string) {
    setSelectedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selectedPacks.size === 0) {
      toast.error("Select at least one study pack.");
      return;
    }
    if (!targetDate) {
      toast.error("Please set an exam date.");
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPackIds: Array.from(selectedPacks),
          intensity,
          preferredTime,
          targetDate: new Date(targetDate).toISOString(),
          dailyMinutes: parseInt(dailyTime),
          instructions: instructions.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate plan");
      }

      const data = await res.json();
      setResult({ count: data.count });
      toast.success(`Study plan created with ${data.count} events!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  }

  if (studyPacks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No study packs available. Generate a study pack first to create an AI study plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Exam Date + Daily Study Time ────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-foreground">Exam Date *</span>
          </div>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-orange-500/50 dark:[color-scheme:dark]"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-foreground">Daily Study Time</span>
          </div>
          <select
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-orange-500/50 dark:[color-scheme:dark]"
          >
            {DAILY_TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Study Intensity ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-orange-400">&#9733;</span>
          <span className="text-sm font-medium text-foreground">Study Intensity</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {INTENSITY_OPTIONS.map((opt) => {
            const isSelected = intensity === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setIntensity(opt.value)}
                className={`flex flex-col items-center rounded-xl border px-4 py-5 text-center transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-border bg-muted/40"
                }`}
              >
                <div
                  className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg ${!isSelected ? "bg-muted text-muted-foreground" : ""}`}
                  style={isSelected ? {
                    backgroundColor: `${opt.color}20`,
                    color: opt.color,
                  } : undefined}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground"}`}>
                  {opt.label}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Preferred Study Time ────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-foreground">Preferred Study Time</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIME_OPTIONS.map((opt) => {
            const isSelected = preferredTime === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setPreferredTime(opt.value)}
                className={`flex flex-col items-center rounded-xl border px-4 py-5 text-center transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-border bg-muted/40"
                }`}
              >
                <div
                  className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg ${!isSelected ? "bg-muted text-muted-foreground" : ""}`}
                  style={isSelected ? {
                    backgroundColor: `${opt.color}20`,
                    color: opt.color,
                  } : undefined}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground"}`}>
                  {opt.label}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Study Packs to Include ──────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium text-foreground">Study Packs to Include *</span>
        </div>
        <div className="space-y-2">
          {studyPacks.map((sp) => {
            const isSelected = selectedPacks.has(sp._id);
            return (
              <button
                key={sp._id}
                onClick={() => togglePack(sp._id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-border bg-muted/40"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? "border-orange-500 bg-orange-500"
                      : "border-border bg-transparent"
                  }`}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm ${isSelected ? "font-medium text-foreground" : "text-foreground"}`}>
                  {sp.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Additional Instructions ─────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm font-medium text-foreground">Additional Instructions (Optional)</span>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="E.g., Focus more on weak areas, include practice quizzes every 3 days..."
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-orange-500/50"
        />
      </div>

      {/* ── Generate Button ─────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={generating || selectedPacks.size === 0 || !targetDate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating Study Plan...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate AI Study Plan
          </>
        )}
      </button>

      {/* ── Result ──────────────────────────────────────── */}
      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-sm font-semibold text-emerald-400">
            Study plan created with {result.count} study sessions!
          </p>
          <p className="mt-1 text-xs text-emerald-500/70">
            View your plan on the Calendar page. Previous AI-generated events were replaced.
          </p>
        </div>
      )}
    </div>
  );
}
