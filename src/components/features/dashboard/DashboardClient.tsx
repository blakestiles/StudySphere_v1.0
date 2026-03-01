"use client";

import Link from "next/link";
import RecentDocuments from "./RecentDocuments";

interface DashboardClientProps {
  userName: string;
  documentCount: number;
  studyPackCount: number;
  quizCount: number;
  weakAreaCount: number;
  currentStreak: number;
  longestStreak: number;
  chartData: { date: string; reviews: number }[];
  documents: {
    _id: string;
    title: string;
    fileType: "pdf" | "text";
    status: "processing" | "ready" | "error";
    uploadedAt: string;
  }[];
  studyPackMap: Record<string, string>;
}

// ── Icons ──────────────────────────────────────────────

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2c.5 4-2 6-2 10a4 4 0 008 0c0-4-2.5-6-2-10M12 12a2 2 0 00-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 00-2-2z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

// ── Simple Bar Chart (Canvas) ──────────────────────────

function MiniBarChart({ data }: { data: { date: string; reviews: number }[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxVal = Math.max(...data.map((d) => d.reviews), 1);
    const barWidth = Math.max(8, (w - 20) / data.length - 6);
    const gap = (w - data.length * barWidth) / (data.length + 1);

    // Bars
    data.forEach((d, i) => {
      const x = gap + i * (barWidth + gap);
      const barH = (d.reviews / maxVal) * (h - 30);
      const y = h - 20 - barH;

      // Bar
      ctx.beginPath();
      const r = Math.min(3, barWidth / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = d.reviews > 0 ? "#f97316" : isDark ? "rgba(71,85,105,0.3)" : "rgba(203,213,225,0.4)";
      ctx.fill();

      // Label
      ctx.font = "400 9px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
      ctx.fillText(d.date.split(" ")[1] || d.date, x + barWidth / 2, h - 5);
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 100 }}
    />
  );
}

import React from "react";

// ── Main Component ─────────────────────────────────────

export default function DashboardClient({
  userName,
  documentCount,
  studyPackCount,
  quizCount,
  weakAreaCount,
  currentStreak,
  longestStreak,
  chartData,
  documents,
  studyPackMap,
}: DashboardClientProps) {
  const stats = [
    { label: "Documents", value: documentCount, icon: FileIcon, color: "#60a5fa" },
    { label: "Study Packs", value: studyPackCount, icon: BookIcon, color: "#f97316" },
    { label: "Quizzes Taken", value: quizCount, icon: CheckIcon, color: "#4ade80" },
    { label: "Weak Areas", value: weakAreaCount, icon: AlertIcon, color: "#ef4444" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Welcome, {userName}! <span className="inline-block">&#128075;</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your study dashboard</p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions (Pill Buttons) ────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/upload">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30">
            <UploadIcon className="h-3.5 w-3.5" />
            Upload Material
          </span>
        </Link>
        <Link href="/study-packs">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <BookIcon className="h-3.5 w-3.5" />
            Study Packs
          </span>
        </Link>
        <Link href="/chat">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            AI Tutor
          </span>
        </Link>
      </div>

      {/* ── Streak + Chart Row ──────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Streak Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15">
              <FlameIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Longest: <span className="font-medium text-muted-foreground">{longestStreak} days</span>
          </p>
        </div>

        {/* Cards Reviewed Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-orange-400">&#9679;</span>
            <span className="text-sm font-medium text-foreground">Cards Reviewed (Last 7 Days)</span>
          </div>
          {chartData.length > 0 ? (
            <MiniBarChart data={chartData} />
          ) : (
            <div className="flex h-[100px] items-center justify-center">
              <p className="text-xs text-muted-foreground">No review data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Documents ────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-xs font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="p-4">
          <RecentDocuments documents={documents} studyPackMap={studyPackMap} />
        </div>
      </div>
    </div>
  );
}
