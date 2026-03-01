"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
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
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
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
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-orange-400">&#9679;</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

// ── Donut Chart (Canvas) ───────────────────────────────

function DonutChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains("dark");

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(cx, cy) - 10;
    const innerR = outerR * 0.65;
    const total = data.reduce((s, d) => s + d.value, 0);

    if (total === 0) {
      // Draw empty ring
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctx.fillStyle = isDark ? "rgba(71,85,105,0.3)" : "rgba(203,213,225,0.4)";
      ctx.fill();

      ctx.font = "600 14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText("No data", cx, cy + 5);
      return;
    }

    let startAngle = -Math.PI / 2;

    for (const segment of data) {
      const sweepAngle = (segment.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sweepAngle);
      ctx.arc(cx, cy, innerR, startAngle + sweepAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      startAngle += sweepAngle;
    }

    // Center text
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#f1f5f9" : "#1e293b";
    ctx.fillText(String(total), cx, cy + 3);
    ctx.font = "400 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.fillText("Total Cards", cx, cy + 20);
  }, [data]);

  return (
    <div className="flex items-center gap-4">
      <canvas
        ref={canvasRef}
        className="h-[160px] w-[160px]"
        style={{ width: 160, height: 160 }}
      />
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
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

// ── Icons ──────────────────────────────────────────────

function CardsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function PenIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2c.5 4-2 6-2 10a4 4 0 008 0c0-4-2.5-6-2-10M12 12a2 2 0 00-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 00-2-2z" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridStroke = isDark ? "rgba(71,85,105,0.3)" : "rgba(203,213,225,0.6)";
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
      <div className="flex items-center justify-center rounded-xl border border-border bg-background py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-background py-20">
        <p className="text-muted-foreground">Failed to load analytics.</p>
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
    <div className="space-y-5">
      {/* ── Top Stat Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CardsIcon />}
          value={totalCardsReviewed}
          label="Cards Reviewed"
          color="#fb923c"
        />
        <StatCard
          icon={<ClockIcon />}
          value={totalStudyMins}
          label="Study Minutes"
          color="#60a5fa"
        />
        <StatCard
          icon={<PenIcon />}
          value={data.totals.essays}
          label="Essays Written"
          color="#c084fc"
        />
        <StatCard
          icon={<FlameIcon />}
          value={data.streak.current}
          label="Day Streak"
          color="#f97316"
        />
      </div>

      {/* ── 2x2 Chart Grid ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Reviews Bar Chart */}
        <ChartCard title="Daily Activity" subtitle="(Last 14 Days)">
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
                  radius={[3, 3, 0, 0]}
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
                  fill="#c084fc"
                  radius={[3, 3, 0, 0]}
                  fillOpacity={0.85}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No activity yet. Start studying!</p>
            </div>
          )}
        </ChartCard>

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
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#fb923c", stroke: dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#fb923c", stroke: "#fff", strokeWidth: 2 }}
                  name="Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No quiz data yet. Take a quiz to see trends!</p>
            </div>
          )}
        </ChartCard>

        {/* Essay Score Trend */}
        <ChartCard
          title="Essay Score Trend"
          subtitle={data.avgEssayScore > 0 ? `(Avg: ${data.avgEssayScore}/10)` : undefined}
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
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#c084fc", stroke: dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#c084fc", stroke: "#fff", strokeWidth: 2 }}
                  name="Score /10"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No essay data yet. Write a practice essay!</p>
            </div>
          )}
        </ChartCard>

        {/* Flashcard Mastery Donut */}
        <ChartCard title="Flashcard Mastery">
          <div className="flex h-[220px] items-center justify-center">
            <DonutChart data={masteryData} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
