"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AnimatedGenerateButton } from "@/components/ui/animated-generate-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import TextShimmer from "@/components/ui/text-shimmer";
import BlurFade from "@/components/ui/blur-fade";

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

/* -- Icons -- */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} - ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export default function WeeklyReportView({ initialReports }: WeeklyReportViewProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latestReport = reports[0] || null;
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
      const report = {
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

      // Replace if same week, otherwise prepend
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
      toast.error(
        error instanceof Error ? error.message : "Failed to generate report"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function renderReport(report: Report) {
    return (
      <div className="space-y-4">
        {/* Summary */}
        <TextGenerateEffect words={report.summary} className="text-white/70 text-sm leading-relaxed" />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Study Min", value: report.stats.studyMinutes },
            { label: "Quizzes", value: report.stats.quizzesTaken },
            { label: "Avg Score", value: `${report.stats.avgScore}%` },
            { label: "Cards", value: report.stats.cardsReviewed },
            { label: "Essays", value: report.stats.essaysWritten },
          ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
          ))}
        </div>

        {/* Strengths / Weaknesses / Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Strengths */}
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <TextShimmer className="text-lg font-semibold text-white mb-3">Strengths</TextShimmer>
            </div>
            <ul className="space-y-1">
              {report.strengths.map((s, i) => (
                <BlurFade key={i} delay={i * 0.08}>
                  <li className="text-xs text-foreground">
                    {s}
                  </li>
                </BlurFade>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
              <TextShimmer className="text-lg font-semibold text-white mb-3">Weaknesses</TextShimmer>
            </div>
            <ul className="space-y-1">
              {report.weaknesses.map((w, i) => (
                <BlurFade key={i} delay={i * 0.08}>
                  <li className="text-xs text-foreground">
                    {w}
                  </li>
                </BlurFade>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <LightbulbIcon className="h-4 w-4 text-blue-500" />
              <TextShimmer className="text-lg font-semibold text-white mb-3">Recommendations</TextShimmer>
            </div>
            <ul className="space-y-1">
              {report.recommendations.map((r, i) => (
                <BlurFade key={i} delay={i * 0.08}>
                  <li className="text-xs text-foreground">
                    {r}
                  </li>
                </BlurFade>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <AnimatedGenerateButton
        isLoading={isGenerating}
        idleLabel="Generate Weekly Report"
        loadingLabel="Analyzing your week..."
        onClick={handleGenerate}
        className="px-6 py-3"
      />

      {/* Latest Report */}
      {latestReport && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {formatDateRange(latestReport.weekStart, latestReport.weekEnd)}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Latest Report</p>
          {renderReport(latestReport)}
        </div>
      )}

      {/* Past Reports */}
      {pastReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Past Reports</h3>
          {pastReports.map((report, index) => (
            <BlurFade key={report._id} delay={index * 0.05}>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === report._id ? null : report._id)
                    }
                    className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-muted/50 transition"
                  >
                    <ChevronRightIcon
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                        expandedId === report._id ? "rotate-90" : ""
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground flex-1">
                      {formatDateRange(report.weekStart, report.weekEnd)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {report.stats.studyMinutes} min studied
                    </span>
                  </button>
                  {expandedId === report._id && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      {renderReport(report)}
                    </div>
                  )}
                </div>
            </BlurFade>
          ))}
        </div>
      )}

      {/* Empty State */}
      {reports.length === 0 && !isGenerating && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <SparklesIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No reports yet. Generate your first weekly report!
          </p>
        </div>
      )}
    </div>
  );
}
