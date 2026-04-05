"use client";

import { useState } from "react";
import { Calendar, Clock, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import Link from "next/link";

interface ExamCountdownProps {
  packId: string;
  initialExamDate?: string | null;
  packTitle: string;
}

export default function ExamCountdown({ packId, initialExamDate, packTitle }: ExamCountdownProps) {
  const [examDate, setExamDate] = useState<string | null>(initialExamDate || null);
  const [editing, setEditing] = useState(false);
  const [inputDate, setInputDate] = useState("");
  const [saving, setSaving] = useState(false);

  const daysLeft = examDate ? differenceInDays(new Date(examDate), new Date()) : null;
  const isPast = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  const isWarning = daysLeft !== null && daysLeft > 3 && daysLeft <= 7;
  const isSafe = daysLeft !== null && daysLeft > 7;

  const save = async (date: string | null) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/study-packs/${packId}/exam-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: date }),
      });
      if (!res.ok) throw new Error();
      setExamDate(date);
      setEditing(false);
      setInputDate("");
      toast.success(date ? "Exam date set" : "Exam date cleared");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const colorClasses = isPast
    ? { card: "border-border/50 bg-muted/20", icon: "text-muted-foreground", text: "text-muted-foreground", badge: "" }
    : isUrgent
    ? { card: "border-red-500/20 bg-red-500/[0.04]", icon: "text-red-500", text: "text-red-600 dark:text-red-400", badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" }
    : isWarning
    ? { card: "border-amber-500/20 bg-amber-500/[0.04]", icon: "text-amber-500", text: "text-amber-600 dark:text-amber-400", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
    : { card: "border-emerald-500/20 bg-emerald-500/[0.04]", icon: "text-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };

  if (!examDate && !editing) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Set an exam date to track your countdown</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/[0.1] transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          Set Exam Date
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
        <Calendar className="h-4 w-4 shrink-0 text-amber-500" />
        <input
          type="date"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
        />
        <button
          onClick={() => save(inputDate || null)}
          disabled={!inputDate || saving}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Confirm"}
        </button>
        <button
          onClick={() => { setEditing(false); setInputDate(""); }}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colorClasses.card}`}>
      <Clock className={`h-4 w-4 shrink-0 ${colorClasses.icon}`} />
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
        {isPast ? (
          <span className="text-sm text-muted-foreground line-through">Exam has passed</span>
        ) : (
          <span className={`text-sm font-semibold ${colorClasses.text}`}>
            Exam in {daysLeft === 0 ? "less than a day" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </span>
        )}
        <span className="text-xs text-muted-foreground truncate">
          · {packTitle} · {format(new Date(examDate!), "MMM d, yyyy")}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/study-plan"
          className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          Study Plan <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Change date"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => save(null)}
          disabled={saving}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          title="Clear exam date"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
