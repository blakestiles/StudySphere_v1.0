"use client";

import { cn } from "@/lib/utils";

interface RetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}

export default function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "rgba(251,191,36,0.15)",
  darkLineColor = "rgba(251,191,36,0.08)",
}: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:300px]",
        className
      )}
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `rotateX(${angle}deg)`,
          backgroundImage: `
            linear-gradient(to right, ${darkLineColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${darkLineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          transformOrigin: "center center",
          top: "-50%",
          left: "-10%",
          right: "-10%",
          bottom: "-50%",
        }}
      />
      {/* Gradient fade at the top */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, var(--grid-fade, #08080F) 15%, transparent 50%, var(--grid-fade, #08080F) 85%)",
        }}
      />
    </div>
  );
}
