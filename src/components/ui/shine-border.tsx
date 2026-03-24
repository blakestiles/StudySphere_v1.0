"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ShineBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
  borderRadius?: number;
}

export default function ShineBorder({
  children,
  className,
  borderWidth = 1,
  duration = 6,
  color = ["#fbbf24", "#f59e0b", "#d97706"],
  borderRadius = 16,
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color.join(", ") : color;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius }}
    >
      {/* Animated border */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          borderRadius,
          padding: borderWidth,
          background: `conic-gradient(from var(--shine-angle, 0deg), transparent 40%, ${colors}, transparent 60%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: `shine-rotate ${duration}s linear infinite`,
        }}
      />
      {/* Content */}
      <div className="relative z-[2]">{children}</div>
      <style jsx>{`
        @property --shine-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes shine-rotate {
          from { --shine-angle: 0deg; }
          to { --shine-angle: 360deg; }
        }
      `}</style>
    </div>
  );
}
