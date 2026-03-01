"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useInView } from "motion/react";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  Target,
  PenTool,
  Clock,
} from "lucide-react";

interface DashboardStatsProps {
  documentCount: number;
  studyPackCount: number;
  quizCount: number;
  focusSessionCount: number;
  essayCount?: number;
  totalHours?: number;
}

const icons = [FileText, BookOpen, CheckCircle2, Target, PenTool, Clock];
const colorConfigs = [
  { text: "text-blue-400", bg: "bg-blue-500/10", glow: "group-hover:shadow-blue-500/10", border: "group-hover:border-blue-500/20" },
  { text: "text-orange-400", bg: "bg-orange-500/10", glow: "group-hover:shadow-orange-500/10", border: "group-hover:border-orange-500/20" },
  { text: "text-emerald-400", bg: "bg-emerald-500/10", glow: "group-hover:shadow-emerald-500/10", border: "group-hover:border-emerald-500/20" },
  { text: "text-violet-400", bg: "bg-violet-500/10", glow: "group-hover:shadow-violet-500/10", border: "group-hover:border-violet-500/20" },
  { text: "text-rose-400", bg: "bg-rose-500/10", glow: "group-hover:shadow-rose-500/10", border: "group-hover:border-rose-500/20" },
  { text: "text-amber-400", bg: "bg-amber-500/10", glow: "group-hover:shadow-amber-500/10", border: "group-hover:border-amber-500/20" },
];

export default function DashboardStats({
  documentCount,
  studyPackCount,
  quizCount,
  focusSessionCount,
  essayCount = 0,
  totalHours = 0,
}: DashboardStatsProps) {
  const stats = [
    { label: "Documents", value: documentCount },
    { label: "Study Packs", value: studyPackCount },
    { label: "Quizzes Taken", value: quizCount },
    { label: "Focus Sessions", value: focusSessionCount },
    { label: "Essays Written", value: essayCount },
    { label: "Study Hours", value: totalHours },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const valueEls = containerRef.current.querySelectorAll(".stat-value");
    valueEls.forEach((el, i) => {
      const target = stats[i].value;
      const isDecimal = !Number.isInteger(target);
      const obj = { val: 0 };
      animate(obj, {
        val: target,
        duration: 1400,
        delay: i * 80,
        ease: "easeOutExpo",
        onUpdate: () => {
          el.textContent = isDecimal
            ? obj.val.toFixed(1)
            : Math.round(obj.val).toString();
        },
      });
    });
  }, [isInView, stats]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = icons[index];
        const colors = colorConfigs[index];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className={`group relative rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:shadow-lg transition-all duration-300 ${colors.glow} ${colors.border} overflow-hidden`}>
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-center justify-between mb-3">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
              </div>
              <div className="relative">
                <div className="stat-value text-2xl sm:text-3xl font-bold tracking-tight">0</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
