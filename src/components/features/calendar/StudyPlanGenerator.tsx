"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Clock, Leaf, Scale, Flame, Sunrise, Sun, Moon,
  Sparkles, Zap, Check, Loader2, BookOpen, PenLine, CalendarCheck2, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";

interface StudyPackOption {
  _id: string;
  title: string;
  examDate?: string | null;
}

interface StudyPlanGeneratorProps {
  studyPacks: StudyPackOption[];
}

// ── Config ─────────────────────────────────────────────

const INTENSITY_OPTIONS = [
  {
    value: "relaxed" as const,
    label: "Relaxed",
    desc: "Slow, steady pace for long-term retention",
    icon: Leaf,
    activeCard: "border-emerald-500/30 bg-emerald-500/[0.07]",
    activeIcon: "bg-emerald-500/12 border-emerald-500/20 text-emerald-500",
    activeLabel: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  {
    value: "balanced" as const,
    label: "Balanced",
    desc: "Moderate workload for consistent progress",
    icon: Scale,
    activeCard: "border-amber-500/30 bg-amber-500/[0.07]",
    activeIcon: "bg-amber-500/12 border-amber-500/20 text-amber-500",
    activeLabel: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    value: "intense" as const,
    label: "Intense",
    desc: "Maximum coverage before deadline",
    icon: Flame,
    activeCard: "border-red-500/30 bg-red-500/[0.07]",
    activeIcon: "bg-red-500/12 border-red-500/20 text-red-500",
    activeLabel: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
];

const TIME_OPTIONS = [
  {
    value: "morning" as const,
    label: "Morning",
    desc: "6 AM – 12 PM",
    icon: Sunrise,
    activeCard: "border-yellow-500/30 bg-yellow-500/[0.07]",
    activeIcon: "bg-yellow-500/12 border-yellow-500/20 text-yellow-500",
    activeLabel: "text-yellow-600 dark:text-yellow-400",
  },
  {
    value: "afternoon" as const,
    label: "Afternoon",
    desc: "12 PM – 6 PM",
    icon: Sun,
    activeCard: "border-orange-500/30 bg-orange-500/[0.07]",
    activeIcon: "bg-orange-500/12 border-orange-500/20 text-orange-500",
    activeLabel: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "evening" as const,
    label: "Evening",
    desc: "6 PM – 12 AM",
    icon: Moon,
    activeCard: "border-violet-500/30 bg-violet-500/[0.07]",
    activeIcon: "bg-violet-500/12 border-violet-500/20 text-violet-500",
    activeLabel: "text-violet-600 dark:text-violet-400",
  },
];

const DAILY_TIME_OPTIONS = [
  { value: "30", label: "30 mins" },
  { value: "60", label: "1 Hour" },
  { value: "90", label: "1.5 Hours" },
  { value: "120", label: "2 Hours" },
  { value: "180", label: "3 Hours" },
];

// ── Sub-components ─────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20">
        <Icon className="h-3.5 w-3.5 text-amber-500" />
      </div>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
    </div>
  );
}

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
    const pack = studyPacks.find((sp) => sp._id === id);
    setSelectedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (pack?.examDate && !targetDate) {
          setTargetDate(new Date(pack.examDate).toISOString().split("T")[0]);
        }
      }
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
          <BookOpen className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">No study packs yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Generate a study pack first to create an AI study plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* ── Intro hero card ────────────────────────────── */}
      <div className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />
        <div className="relative p-5 flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-lg" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13.5px] font-semibold text-foreground">AI Study Plan Generator</h2>
            <p className="text-[11.5px] text-muted-foreground/70 mt-0.5 leading-relaxed">
              Configure your goals and we'll build a day-by-day schedule, automatically added to your calendar.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                { icon: CalendarCheck2, label: "Synced to Calendar" },
                { icon: Zap, label: "AI-Powered" },
                { icon: PenLine, label: "Customizable" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1 text-[10.5px] text-muted-foreground/60 bg-muted/40 border border-border/40 rounded-md px-2 py-0.5">
                  <Icon className="h-3 w-3" />{label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Exam date + Daily time ─────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <SectionLabel icon={CalendarDays} label="Exam Date *" />
          <DatePicker
            value={targetDate}
            onChange={setTargetDate}
            min={new Date().toISOString().split("T")[0]}
            placeholder="Select exam date..."
          />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <SectionLabel icon={Clock} label="Daily Study Time" />
          <CustomSelect
            value={dailyTime}
            onValueChange={setDailyTime}
            options={DAILY_TIME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </div>

      {/* ── Study Intensity ────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <SectionLabel icon={Flame} label="Study Intensity" />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {INTENSITY_OPTIONS.map((opt) => {
            const isSelected = intensity === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setIntensity(opt.value)}
                className={`flex flex-col items-center rounded-xl border px-4 py-4 text-center transition-all ${
                  isSelected ? opt.activeCard : "border-border/50 bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border ${
                  isSelected ? opt.activeIcon : "bg-muted/60 border-border/40 text-muted-foreground"
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className={`text-[12.5px] font-semibold ${isSelected ? opt.activeLabel : "text-foreground/80"}`}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground/60">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Preferred Study Time ───────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <SectionLabel icon={Clock} label="Preferred Study Time" />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {TIME_OPTIONS.map((opt) => {
            const isSelected = preferredTime === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setPreferredTime(opt.value)}
                className={`flex flex-col items-center rounded-xl border px-4 py-4 text-center transition-all ${
                  isSelected ? opt.activeCard : "border-border/50 bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border ${
                  isSelected ? opt.activeIcon : "bg-muted/60 border-border/40 text-muted-foreground"
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className={`text-[12.5px] font-semibold ${isSelected ? opt.activeLabel : "text-foreground/80"}`}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground/60">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Study Packs ────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3.5">
          <SectionLabel icon={BookOpen} label="Study Packs to Include *" />
          <span className="text-[11px] text-muted-foreground/50 -mt-3.5">
            {selectedPacks.size}/{studyPacks.length} selected
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {studyPacks.map((sp) => {
            const isSelected = selectedPacks.has(sp._id);
            return (
              <button
                key={sp._id}
                onClick={() => togglePack(sp._id)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  isSelected
                    ? "border-amber-500/30 bg-amber-500/[0.07]"
                    : "border-border/50 bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-500"
                    : "border-border/60 bg-transparent"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-[12.5px] font-medium text-foreground/80 truncate flex-1">{sp.title}</span>
                {sp.examDate && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(sp.examDate), "MMM d")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Additional Instructions ────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <SectionLabel icon={PenLine} label="Additional Instructions (Optional)" />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="E.g., Focus more on weak areas, include practice quizzes every 3 days…"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
        />
      </div>

      {/* ── Generate button ────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={generating || selectedPacks.size === 0 || !targetDate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_2px_16px_oklch(0.76_0.17_62_/_28%)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating Study Plan…</>
        ) : (
          <><Zap className="h-4 w-4" /> Generate AI Study Plan</>
        )}
      </button>

      {/* ── Result ─────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-card p-5"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-green-400 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 border border-emerald-500/25">
                <CalendarCheck2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Plan created — {result.count} study sessions added!
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground/60">
                  View your schedule on the Calendar page. Previous AI events were replaced.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
