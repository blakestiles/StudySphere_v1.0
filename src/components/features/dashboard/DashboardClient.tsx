"use client";

import React from "react";
import Link from "next/link";
import RecentDocuments from "./RecentDocuments";
import BlurFade from "@/components/ui/blur-fade";
import ShineBorder from "@/components/ui/shine-border";
import ShimmerButton from "@/components/ui/shimmer-button";
import { GradientButton } from "@/components/ui/gradient-button";
import { SparklesText } from "@/components/ui/sparkles-text";
import Meteors from "@/components/ui/meteors";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";

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

// ── Mini Bar Chart ──────────────────────────────────────

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

    data.forEach((d, i) => {
      const x = gap + i * (barWidth + gap);
      const barH = (d.reviews / maxVal) * (h - 30);
      const y = h - 20 - barH;
      const r = Math.min(4, barWidth / 2);

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);

      const isDark = document.documentElement.classList.contains("dark");

      if (d.reviews > 0) {
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, isDark ? "rgba(251,191,36,0.9)" : "rgba(217,119,6,0.85)");
        grad.addColorStop(1, isDark ? "rgba(249,115,22,0.6)" : "rgba(234,88,12,0.6)");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
      }
      ctx.fill();

      ctx.font = "400 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
      ctx.fillText(d.date.split(" ")[1] || d.date, x + barWidth / 2, h - 5);
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: 96 }} />;
}

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
    {
      label: "Documents",
      value: documentCount,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      ),
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/8 dark:bg-blue-400/8",
      border: "border-blue-500/12 dark:border-blue-400/12",
    },
    {
      label: "Study Packs",
      value: studyPackCount,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/8 dark:bg-amber-400/8",
      border: "border-amber-500/12 dark:border-amber-400/12",
    },
    {
      label: "Quizzes Taken",
      value: quizCount,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/8 dark:bg-emerald-400/8",
      border: "border-emerald-500/12 dark:border-emerald-400/12",
    },
    {
      label: "Weak Areas",
      value: weakAreaCount,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/8 dark:bg-rose-400/8",
      border: "border-rose-500/12 dark:border-rose-400/12",
    },
  ];

  const firstName = userName.split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      {/* ── Header ──────────────────────────────────────── */}
      <BlurFade delay={0}>
        <div className="pt-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, <SparklesText text={firstName} className="inline" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your study overview</p>
        </div>
      </BlurFade>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <BlurFade key={stat.label} delay={0.05 + i * 0.08}>
              <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/20 transition-all duration-300 group h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${stat.bg} ${stat.border} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="font-display text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
              </div>
          </BlurFade>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <BlurFade delay={0.2}>
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/upload">
          <ShimmerButton className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload Material
          </ShimmerButton>
        </Link>
        <Link href="/study-packs">
          <GradientButton variant="outline" className="flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Study Packs
          </GradientButton>
        </Link>
        <Link href="/chat">
          <GradientButton variant="outline" className="flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            AI Tutor
          </GradientButton>
        </Link>
        <Link href="/focus">
          <GradientButton variant="outline" className="flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            Focus Mode
          </GradientButton>
        </Link>
      </div>
      </BlurFade>

      {/* ── Streak + Chart Row ──────────────────────────── */}
      <BlurFade delay={0.3}>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Streak Card */}
        <ShineBorder borderRadius={16} duration={10} color={["#fbbf24", "#f59e0b", "transparent", "transparent"]}>
        <div className="rounded-2xl bg-card p-5 relative overflow-hidden">
          <Meteors count={5} className="opacity-40" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Study Streak</p>
          <div className="flex items-end gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 2c.5 4-2 6-2 10a4 4 0 008 0c0-4-2.5-6-2-10M12 12a2 2 0 00-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-foreground tracking-tight leading-none">{currentStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">day streak</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Longest: <span className="font-semibold text-foreground">{longestStreak} days</span>
            </p>
          </div>
        </div>
        </ShineBorder>

        {/* Chart Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 relative overflow-hidden">
          <AnimatedGridPattern className="absolute inset-0 opacity-[0.15] pointer-events-none" numSquares={12} duration={4} />
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cards Reviewed — Last 7 Days</span>
          </div>
          {chartData.length > 0 ? (
            <MiniBarChart data={chartData} />
          ) : (
            <div className="flex h-24 items-center justify-center">
              <p className="text-xs text-muted-foreground">No review data yet — start reviewing flashcards!</p>
            </div>
          )}
        </div>
      </div>
      </BlurFade>

      {/* ── Recent Documents ────────────────────────────── */}
      <BlurFade delay={0.4}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold text-foreground">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="p-4">
          <RecentDocuments documents={documents} studyPackMap={studyPackMap} />
        </div>
      </div>
      </BlurFade>
    </div>
  );
}
