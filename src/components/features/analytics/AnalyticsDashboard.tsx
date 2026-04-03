"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  Flame,
  Clock,
  PenLine,
  BookOpen,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DailyActivity {
  date: string;
  reviews: number;
  quizzes: number;
  essays: number;
  focusMins: number;
  total: number;
}

interface AnalyticsData {
  dailyActivity: DailyActivity[];
  totals: {
    documents: number;
    studyPacks: number;
    quizzes: number;
    focusSessions: number;
    essays: number;
    cardsReviewed: number;
  };
  streak: {
    current: number;
    longest: number;
    totalStudyMinutes: number;
    lastReviewDate: string | null;
  };
  quizScores: { date: string; score: number; correct: number; total: number }[];
  essayScores: { date: string; score: number }[];
  avgEssayScore: number;
  flashcardMastery: {
    new: number;
    learning: number;
    mastered: number;
    total: number;
  };
}

// ── Stat Card ──────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconBorder,
  iconColor,
  delay,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconBorder} border ${iconColor}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-foreground leading-none">
          {String(value)}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Chart Card Wrapper ─────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 h-full">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        {subtitle && (
          <span className="ml-auto text-[11px] text-muted-foreground/60">{subtitle}</span>
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

// ── Custom Recharts Tooltip ────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridStroke = isDark ? "rgba(71,85,105,0.25)" : "rgba(203,213,225,0.5)";
  const tickFill = isDark ? "#64748b" : "#94a3b8";
  const dotStroke = isDark ? "#1e293b" : "#ffffff";

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-20">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Failed to load analytics.</p>
      </div>
    );
  }

  // ── Prepare chart data ─────────────────────────────

  const totalCardsReviewed = data.totals.cardsReviewed;
  const totalStudyMins = data.streak.totalStudyMinutes;

  // Daily activity - last 14 days
  const reviewChartData = data.dailyActivity.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reviews: d.reviews,
    quizzes: d.quizzes,
    essays: d.essays,
    total: d.total,
  }));

  // Quiz score trend (directly from QuizAttempt records)
  const quizData = data.quizScores.map((q) => ({
    date: new Date(q.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: q.score,
  }));

  // Essay score trend
  const essayChartData = data.essayScores.map((e) => ({
    date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: e.score,
  }));

  // Flashcard mastery donut
  const masteryData = [
    { name: "New", value: data.flashcardMastery.new, color: "#60a5fa" },
    { name: "Learning", value: data.flashcardMastery.learning, color: "#fb923c" },
    { name: "Mastered", value: data.flashcardMastery.mastered, color: "#4ade80" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Streak Hero Card ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden p-5"
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-orange-500/[0.03] pointer-events-none" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: streak count */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide mb-0.5">
                Day Streak
              </p>
              <p className="font-display text-5xl font-bold text-foreground leading-none">
                {data.streak.current}
              </p>
            </div>
          </div>

          {/* Right: mini chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5">
              <Flame className="h-3 w-3 text-amber-500" />
              Longest: {data.streak.longest} days
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5">
              <Clock className="h-3 w-3 text-blue-400" />
              {totalStudyMins} study mins
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5">
              <BookOpen className="h-3 w-3 text-emerald-400" />
              {totalCardsReviewed} cards reviewed
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 Stat Cards ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          value={totalCardsReviewed}
          label="Cards Reviewed"
          iconBg="bg-amber-500/10"
          iconBorder="border-amber-500/20"
          iconColor="text-amber-500"
          delay={0.06}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          value={totalStudyMins}
          label="Study Minutes"
          iconBg="bg-blue-500/10"
          iconBorder="border-blue-500/20"
          iconColor="text-blue-400"
          delay={0.12}
        />
        <StatCard
          icon={<PenLine className="h-4 w-4" />}
          value={data.totals.essays}
          label="Essays Written"
          iconBg="bg-purple-500/10"
          iconBorder="border-purple-500/20"
          iconColor="text-purple-400"
          delay={0.18}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          value={data.totals.quizzes}
          label="Quizzes Taken"
          iconBg="bg-emerald-500/10"
          iconBorder="border-emerald-500/20"
          iconColor="text-emerald-400"
          delay={0.24}
        />
      </div>

      {/* ── Charts Row 1 ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Daily Activity Bar Chart (2 cols) */}
        <div className="md:col-span-2">
          <ChartCard title="Daily Activity" subtitle="Last 14 Days">
            {reviewChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reviewChartData}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    tick={{ fill: tickFill }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={10}
                    tick={{ fill: tickFill }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="reviews"
                    name="Reviews"
                    fill="#fb923c"
                    radius={[0, 0, 0, 0]}
                    fillOpacity={0.85}
                    stackId="a"
                  />
                  <Bar
                    dataKey="quizzes"
                    name="Quizzes"
                    fill="#60a5fa"
                    radius={[0, 0, 0, 0]}
                    fillOpacity={0.85}
                    stackId="a"
                  />
                  <Bar
                    dataKey="essays"
                    name="Essays"
                    fill="#a78bfa"
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.85}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2">
                <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No activity yet. Start studying!</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Flashcard Mastery Pie (1 col) */}
        <ChartCard title="Flashcard Mastery">
          {data.flashcardMastery.total > 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-4">
              <div className="relative flex justify-center">
                <PieChart width={130} height={130}>
                  <Pie
                    data={masteryData}
                    cx={65}
                    cy={65}
                    innerRadius={42}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {masteryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-display text-foreground">
                    {data.flashcardMastery.total}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">cards</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full px-2">
                {masteryData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2">
              <BookOpen className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No flashcard data yet.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quiz Score Trend */}
        <ChartCard title="Quiz Score Trend">
          {quizData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quizData}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tick={{ fill: tickFill }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  fontSize={10}
                  tick={{ fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f59e0b", stroke: dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                  name="Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2">
              <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No quiz data yet. Take a quiz!</p>
            </div>
          )}
        </ChartCard>

        {/* Essay Score Trend */}
        <ChartCard
          title="Essay Score Trend"
          subtitle={data.avgEssayScore > 0 ? `Avg: ${data.avgEssayScore}/10` : undefined}
        >
          {essayChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={essayChartData}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tick={{ fill: tickFill }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  fontSize={10}
                  tick={{ fill: tickFill }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#a78bfa", stroke: dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#a78bfa", stroke: "#fff", strokeWidth: 2 }}
                  name="Score /10"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2">
              <PenLine className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No essay data yet. Write a practice essay!</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
