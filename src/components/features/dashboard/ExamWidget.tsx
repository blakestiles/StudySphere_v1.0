"use client";

import { useEffect, useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";

export default function ExamWidget() {
  const [nearestExam, setNearestExam] = useState<{ title: string; examDate: string; packId: string } | null>(null);

  useEffect(() => {
    fetch("/api/study-packs")
      .then((r) => r.json())
      .then((packs) => {
        const now = new Date();
        const upcoming = (packs as any[])
          .filter((p) => p.examDate && new Date(p.examDate) > now)
          .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
        if (upcoming.length > 0) {
          setNearestExam({ title: upcoming[0].title, examDate: upcoming[0].examDate, packId: String(upcoming[0]._id) });
        }
      })
      .catch(() => {});
  }, []);

  if (!nearestExam) return null;

  const days = differenceInDays(new Date(nearestExam.examDate), new Date());
  const urgent = days <= 3;
  const warning = days <= 7;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      urgent
        ? "border-red-500/20 bg-red-500/[0.04]"
        : warning
        ? "border-amber-500/20 bg-amber-500/[0.04]"
        : "border-emerald-500/20 bg-emerald-500/[0.04]"
    }`}>
      <Calendar className={`h-4 w-4 shrink-0 ${urgent ? "text-red-500" : warning ? "text-amber-500" : "text-emerald-500"}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{nearestExam.title}</span>
        <span className={`text-xs ml-2 ${urgent ? "text-red-600 dark:text-red-400" : warning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {days === 0 ? "Today!" : `${days} day${days !== 1 ? "s" : ""} away`}
        </span>
        <span className="text-xs text-muted-foreground ml-2">· {format(new Date(nearestExam.examDate), "MMM d")}</span>
      </div>
      <Link
        href="/study-plan"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        Study Plan <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
