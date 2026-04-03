"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, CheckCircle2, AlertCircle, Lightbulb,
  ChevronRight, Loader2, Clock, BarChart3, BookOpen,
  PenLine, Brain, FileText,
} from "lucide-react";

interface ReportStats {
  studyMinutes: number;
  quizzesTaken: number;
  avgScore: number;
  cardsReviewed: number;
  essaysWritten: number;
}

interface Report {
  _id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  stats: ReportStats;
  createdAt: string;
}

interface WeeklyReportViewProps {
  initialReports: Report[];
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

/* ── Stat chips row ──────────────────────────────────── */

function ReportStats({ stats }: { stats: ReportStats }) {
  const items = [
    { icon: Clock, label: "Study Mins", value: stats.studyMinutes, color: "text-blue-500" },
    { icon: BarChart3, label: "Quizzes", value: stats.quizzesTaken, color: "text-amber-500" },
    { icon: Brain, label: "Avg Score", value: `${stats.avgScore}%`, color: "text-violet-500" },
    { icon: BookOpen, label: "Cards", value: stats.cardsReviewed, color: "text-emerald-500" },
    { icon: PenLine, label: "Essays", value: stats.essaysWritten, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex flex-col items-center rounded-xl border border-border/50 bg-muted/30 py-2.5 px-1 text-center">
          <Icon className={`h-3.5 w-3.5 mb-1 ${color}`} />
          <p className="text-[13px] font-bold font-display text-foreground leading-none">{value}</p>
          <p className="text-[9.5px] text-muted-foreground/60 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Section card ────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  accent: {
    border: string;
    bg: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    dot: string;
  };
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent.border} ${accent.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${accent.iconBg} ${accent.iconBorder}`}>
          <Icon className={`h-3.5 w-3.5 ${accent.iconColor}`} />
        </div>
        <span className="text-[12.5px] font-semibold text-foreground">{title}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground/80">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Full report body ────────────────────────────────── */

function ReportBody({ report }: { report: Report }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-[13px] leading-relaxed text-muted-foreground/80">{report.summary}</p>

      {/* Stats */}
      <ReportStats stats={report.stats} />

      {/* Sections */}
      <div className="grid gap-3 md:grid-cols-3">
        <SectionCard
          icon={CheckCircle2}
          title="Strengths"
          items={report.strengths}
          accent={{
            border: "border-emerald-500/20",
            bg: "bg-emerald-500/[0.04]",
            iconBg: "bg-emerald-500/10",
            iconBorder: "border-emerald-500/20",
            iconColor: "text-emerald-500",
            dot: "bg-emerald-400/70",
          }}
        />
        <SectionCard
          icon={AlertCircle}
          title="Weaknesses"
          items={report.weaknesses}
          accent={{
            border: "border-red-500/20",
            bg: "bg-red-500/[0.04]",
            iconBg: "bg-red-500/10",
            iconBorder: "border-red-500/20",
            iconColor: "text-red-500",
            dot: "bg-red-400/70",
          }}
        />
        <SectionCard
          icon={Lightbulb}
          title="Recommendations"
          items={report.recommendations}
          accent={{
            border: "border-blue-500/20",
            bg: "bg-blue-500/[0.04]",
            iconBg: "bg-blue-500/10",
            iconBorder: "border-blue-500/20",
            iconColor: "text-blue-500",
            dot: "bg-blue-400/70",
          }}
        />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */

export default function WeeklyReportView({ initialReports }: WeeklyReportViewProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latestReport = reports[0] ?? null;
  const pastReports = reports.slice(1);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }

      const data = await res.json();
      const report: Report = {
        _id: data.report._id,
        weekStart: data.report.weekStart,
        weekEnd: data.report.weekEnd,
        summary: data.report.summary,
        strengths: data.report.strengths,
        weaknesses: data.report.weaknesses,
        recommendations: data.report.recommendations,
        stats: data.report.stats,
        createdAt: data.report.createdAt,
      };

      const existing = reports.findIndex((r) => r.weekStart === report.weekStart);
      if (existing >= 0) {
        const updated = [...reports];
        updated[existing] = report;
        setReports(updated);
      } else {
        setReports([report, ...reports]);
      }

      toast.success("Weekly report generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* ── Generate card ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />
        <div className="relative p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-lg" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-foreground">Generate This Week's Report</p>
            <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">
              AI analyzes your activity — quizzes, essays, flashcards, focus sessions — and gives personalized feedback.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
              : <><Sparkles className="h-3.5 w-3.5" /> Generate</>
            }
          </button>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────── */}
      {reports.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-14 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <FileText className="h-6 w-6 text-amber-500/70" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No reports yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Generate your first weekly report above to get started.</p>
          </div>
        </motion.div>
      )}

      {/* ── Latest report ──────────────────────────────── */}
      <AnimatePresence>
        {latestReport && (
          <motion.div
            key={latestReport._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-[13px] font-bold text-foreground">Latest Report</p>
                  <p className="text-[11px] text-muted-foreground/60">{formatDateRange(latestReport.weekStart, latestReport.weekEnd)}</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground/50 bg-muted/40 border border-border/40 rounded-md px-2 py-0.5">
                {new Date(latestReport.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="p-5">
              <ReportBody report={latestReport} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Past reports ───────────────────────────────── */}
      {pastReports.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">Past Reports</p>
          {pastReports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <button
                onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <motion.div
                  animate={{ rotate: expandedId === report._id ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </motion.div>
                <span className="text-[13px] font-medium text-foreground flex-1">
                  {formatDateRange(report.weekStart, report.weekEnd)}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{report.stats.studyMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />{report.stats.avgScore}%
                  </span>
                </div>
              </button>
              <AnimatePresence>
                {expandedId === report._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-border/40">
                      <ReportBody report={report} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
