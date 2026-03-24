"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
  sublabel?: string;
  accent?: string;
}

interface ScrollParallaxStatsProps {
  stats: StatItem[];
  className?: string;
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center px-6 py-8 relative"
    >
      {/* Divider between items */}
      {index > 0 && (
        <div className="absolute left-0 top-8 bottom-8 w-px bg-white/[0.05]" />
      )}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.15, ease: "easeOut" }}
        className={cn(
          "font-display font-bold tracking-tight mb-2",
          stat.accent ?? "text-white",
          "text-4xl sm:text-5xl"
        )}
      >
        {stat.value}
      </motion.div>
      <div className="text-sm font-semibold text-white/60 mb-1">{stat.label}</div>
      {stat.sublabel && (
        <div className="text-xs text-white/25">{stat.sublabel}</div>
      )}
    </motion.div>
  );
}

export function ScrollParallaxStats({ stats, className }: ScrollParallaxStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const leftX = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const rightX = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Animated background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <motion.span
          style={{ x: leftX }}
          className="absolute text-[12vw] font-display font-black text-white/[0.015] whitespace-nowrap"
        >
          STUDY SMARTER
        </motion.span>
      </div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]"
      >
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </motion.div>

      {/* Scrolling word strip — bottom */}
      <div className="border-t border-white/[0.04] overflow-hidden py-3">
        <div className="flex items-center gap-8">
          <motion.div style={{ x: rightX }} className="flex items-center gap-8 w-max">
            {[
              "Spaced Repetition",
              "AI Summaries",
              "Mind Maps",
              "Adaptive Quizzes",
              "Cornell Notes",
              "Focus Mode",
              "Knowledge Graph",
              "Practice Essays",
              "Audio Study",
              "Exam Simulator",
              "Goal Tracking",
              "Weekly Reports",
              "Spaced Repetition",
              "AI Summaries",
              "Mind Maps",
              "Adaptive Quizzes",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-3 text-[11px] text-white/20 whitespace-nowrap font-medium tracking-wide uppercase">
                <span className="w-1 h-1 rounded-full bg-amber-500/30 shrink-0" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ScrollParallaxStats;
