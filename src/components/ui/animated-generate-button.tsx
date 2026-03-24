"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";

const SPARKS = [
  { x: -26, y: -18 },
  { x: 24, y: -22 },
  { x: -22, y: 16 },
  { x: 22, y: 14 },
  { x: 2, y: -26 },
  { x: -8, y: 22 },
  { x: 14, y: -10 },
  { x: -16, y: -8 },
];

interface AnimatedGenerateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  idleLabel?: string;
  loadingLabel?: string;
}

export function AnimatedGenerateButton({
  isLoading = false,
  idleLabel = "Generate",
  loadingLabel = "Generating...",
  className,
  children,
  onMouseEnter,
  ...props
}: AnimatedGenerateButtonProps) {
  const [burst, setBurst] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    onMouseEnter?.(e);
  };

  return (
    <button
      disabled={isLoading}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group relative inline-flex w-full items-center justify-center gap-2 overflow-visible rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300",
        !isLoading
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98]"
          : "cursor-not-allowed border border-amber-500/20 bg-amber-500/10 text-amber-400/70",
        className
      )}
      {...props}
    >
      {/* Spark burst particles */}
      <AnimatePresence>
        {burst &&
          SPARKS.map((spark, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute z-20 select-none text-[9px] text-white"
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [1, 0.9, 0],
                scale: [0, 1.2, 0.6],
                x: spark.x,
                y: spark.y,
              }}
              transition={{ duration: 0.55, delay: i * 0.04, ease: "easeOut" }}
            >
              ✦
            </motion.span>
          ))}
      </AnimatePresence>

      {/* Icon */}
      <span className="relative z-10 shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        )}
      </span>

      {/* Label with crossfade */}
      <AnimatePresence mode="wait">
        <motion.span
          key={isLoading ? "loading" : "idle"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="relative z-10"
        >
          {isLoading ? loadingLabel : (children ?? idleLabel)}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default AnimatedGenerateButton;
