"use client";

import React from "react";
import Link from "next/link";
import RecentDocuments from "./RecentDocuments";
import BlurFade from "@/components/ui/blur-fade";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import ExamWidget from "./ExamWidget";

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
    fileType: "pdf" | "text" | "image" | "url" | "notion" | "gdocs";
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
    const barWidth = Math.max(10, (w - 24) / data.length - 8);
    const gap = (w - data.length * barWidth) / (data.length + 1);

    data.forEach((d, i) => {
      const x = gap + i * (barWidth + gap);
      const barH = (d.reviews / maxVal) * (h - 36);
      const y = h - 22 - barH;
      const r = Math.min(5, barWidth / 2);

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
        grad.addColorStop(0, isDark ? "rgba(251,191,36,0.95)" : "rgba(217,119,6,0.9)");
        grad.addColorStop(1, isDark ? "rgba(249,115,22,0.5)" : "rgba(234,88,12,0.5)");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
      }
      ctx.fill();

      ctx.font = "500 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)";
      ctx.fillText(d.date.split(" ")[1] || d.date, x + barWidth / 2, h - 6);
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: 112 }} />;
}

// ── Greeting time helper ────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
      href: "/documents",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      ),
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/8",
      border: "border-blue-500/15",
      bar: "bg-blue-500",
    },
    {
      label: "Study Packs",
      value: studyPackCount,
      href: "/study-packs",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/8",
      border: "border-amber-500/15",
      bar: "bg-amber-500",
    },
    {
      label: "Quizzes Taken",
      value: quizCount,
      href: "/history",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/15",
      bar: "bg-emerald-500",
    },
    {
      label: "Weak Areas",
      value: weakAreaCount,
      href: "/analytics",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/8",
      border: "border-rose-500/15",
      bar: "bg-rose-500",
    },
  ];

  const quickActions = [
    {
      href: "/upload",
      label: "Upload Material",
      description: "Add a new document",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      ),
      primary: true,
    },
    {
      href: "/study-packs",
      label: "Study Packs",
      description: "Review your packs",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
      primary: false,
    },
    {
      href: "/chat",
      label: "AI Tutor",
      description: "Ask anything",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      primary: false,
    },
    {
      href: "/focus",
      label: "Focus Mode",
      description: "Start a session",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
      ),
      primary: false,
    },
    {
      href: "/exam-simulator",
      label: "Exam Simulator",
      description: "Test yourself",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      primary: false,
    },
  ];

  const firstName = userName.split(" ")[0];
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-8">

      {/* ── Hero Greeting ─────────────────────────────── */}
      <BlurFade delay={0}>
        <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden px-6 py-5">
          {/* Subtle amber wash top-left */}
          <div className="absolute top-0 left-0 w-64 h-full bg-gradient-to-r from-amber-500/[0.05] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent rounded-l-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground/60 font-medium mb-1">{today}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting}, <span className="text-amber-500 dark:text-amber-400">{firstName}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your study overview for today.</p>
            </div>

            {/* Streak badge */}
            <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-5 py-3.5 text-center min-w-[88px]">
              <svg className="h-5 w-5 text-amber-500 mb-1 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
              <p className="font-display text-2xl font-bold leading-none text-amber-500 dark:text-amber-400">{currentStreak}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">day streak</p>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <BlurFade key={stat.label} delay={0.06 + i * 0.07}>
            <Link href={stat.href}>
              <div className="group relative rounded-2xl border border-border/50 bg-card px-4 py-4 hover:border-border transition-all duration-200 hover:shadow-[0_4px_20px_oklch(0_0_0_/_12%)] cursor-pointer overflow-hidden">
                {/* Colored top bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${stat.bar} opacity-40 group-hover:opacity-70 transition-opacity`} />

                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${stat.bg} ${stat.border} ${stat.color} mb-3 group-hover:scale-105 transition-transform duration-200`}>
                  {stat.icon}
                </div>
                <p className="font-display text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
              </div>
            </Link>
          </BlurFade>
        ))}
      </div>

      {/* ── Exam Countdown Widget ────────────────────────── */}
      <BlurFade delay={0.22}>
        <ExamWidget />
      </BlurFade>

      {/* ── Bento Row: Recent Docs + Sidebar ────────────── */}
      <BlurFade delay={0.25}>
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

          {/* Recent Documents */}
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                <h2 className="font-display text-sm font-semibold tracking-tight">Recent Documents</h2>
              </div>
              <Link href="/documents" className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-4 transition-colors flex items-center gap-0.5">
                View all <span className="opacity-60 ml-0.5">→</span>
              </Link>
            </div>
            <div className="p-3">
              <RecentDocuments documents={documents} studyPackMap={studyPackMap} />
            </div>
          </div>

          {/* Quick Actions sidebar */}
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="border-b border-border/40 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                <h2 className="font-display text-sm font-semibold tracking-tight">Quick Actions</h2>
              </div>
            </div>
            <div className="p-2">
              {quickActions.map(({ href, label, description, icon, primary }) => (
                <Link key={href} href={href}>
                  <div className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer ${
                    primary
                      ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 hover:from-amber-500/15 hover:to-orange-500/10 border border-amber-500/15 mb-1"
                      : "hover:bg-muted/40"
                  }`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      primary
                        ? "bg-amber-500 text-white"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-500"
                    }`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${primary ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{label}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">{description}</p>
                    </div>
                    <svg className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Personal best */}
            <div className="mx-4 mb-3 mt-1 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Best streak</span>
                <span className="font-semibold text-foreground">{longestStreak} days</span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.min(currentStreak, 7) ? "bg-amber-500/70" : "bg-muted/50"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* ── Activity Chart ──────────────────────────────── */}
      <BlurFade delay={0.35}>
        <div className="rounded-2xl border border-border/50 bg-card p-5 relative overflow-hidden">
          <AnimatedGridPattern className="absolute inset-0 opacity-[0.08] pointer-events-none" numSquares={16} duration={4} />
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span className="text-sm font-semibold">Cards Reviewed</span>
              <span className="text-xs text-muted-foreground/60">— last 7 days</span>
            </div>
            {chartData.length > 0 && (
              <span className="text-xs text-muted-foreground/50 font-medium tabular-nums">
                {chartData.reduce((s, d) => s + d.reviews, 0)} total
              </span>
            )}
          </div>
          {chartData.length > 0 ? (
            <MiniBarChart data={chartData} />
          ) : (
            <div className="flex h-28 items-center justify-center">
              <p className="text-xs text-muted-foreground">No review data yet — start reviewing flashcards!</p>
            </div>
          )}
        </div>
      </BlurFade>

    </div>
  );
}
