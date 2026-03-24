"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export default function BorderBeam({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "#fbbf24",
  colorTo = "#f59e0b",
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        maskImage: `conic-gradient(from 0deg, transparent 0%, #000 3%, transparent 6%)`,
        WebkitMaskImage: `conic-gradient(from 0deg, transparent 0%, #000 3%, transparent 6%)`,
        animation: `border-beam-spin ${duration}s linear ${delay}s infinite`,
        padding: borderWidth,
        background: `conic-gradient(from 0deg, transparent 60%, ${colorFrom}, ${colorTo}, transparent 90%)`,
      }}
    >
      <div
        className="h-full w-full rounded-[inherit]"
        style={{
          background: "inherit",
          backgroundClip: "padding-box",
          WebkitBackgroundClip: "padding-box",
          backgroundColor: "var(--background, #08080F)",
        }}
      />
      <style jsx>{`
        @keyframes border-beam-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
