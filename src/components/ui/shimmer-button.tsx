"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
  background?: string;
  borderRadius?: string;
  onClick?: () => void;
}

export default function ShimmerButton({
  children,
  className,
  shimmerColor = "rgba(255,255,255,0.15)",
  shimmerSize = "0.08em",
  shimmerDuration = "2.5s",
  background = "linear-gradient(110deg, #f59e0b, #d97706, #f59e0b)",
  borderRadius = "100px",
  onClick,
}: ShimmerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]",
        className
      )}
      style={{
        background,
        borderRadius,
        backgroundSize: "200% 100%",
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ borderRadius }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 20%, ${shimmerColor} 50%, transparent 80%)`,
            backgroundSize: "200% 100%",
            animation: `shimmer-slide ${shimmerDuration} ease-in-out infinite`,
          }}
        />
      </div>
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <style jsx>{`
        @keyframes shimmer-slide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </button>
  );
}
