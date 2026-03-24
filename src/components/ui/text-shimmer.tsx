"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TextShimmerProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  spread?: number;
}

export default function TextShimmer({
  children,
  className,
  duration = 3,
  spread = 2,
}: TextShimmerProps) {
  return (
    <span
      className={cn(
        "inline-flex bg-clip-text text-transparent",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(
          110deg,
          rgba(251,191,36,0.7) 35%,
          rgba(255,255,255,0.95) 50%,
          rgba(251,191,36,0.7) 65%
        )`,
        backgroundSize: `${spread * 100}% 100%`,
        animation: `text-shimmer-move ${duration}s ease-in-out infinite`,
        WebkitBackgroundClip: "text",
      }}
    >
      {children}
      <style jsx>{`
        @keyframes text-shimmer-move {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </span>
  );
}
