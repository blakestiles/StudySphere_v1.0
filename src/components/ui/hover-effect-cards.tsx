"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// The HoverEffect component renders a grid of items with animated hover backgrounds
export function HoverEffect({
  items,
  className,
}: {
  items: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Animated hover background */}
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-amber-500/[0.08] block rounded-2xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>

          {/* Card content */}
          <div className="rounded-2xl h-full w-full p-6 overflow-hidden bg-white/[0.02] border border-white/[0.06] group-hover:border-amber-500/20 relative z-20 transition-colors duration-300">
            <div className="relative z-20">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 group-hover:border-amber-500/25 transition-colors">
                {item.icon}
              </div>
              <h4 className="font-display font-semibold text-white text-[15px] mb-2 group-hover:text-amber-300 transition-colors">
                {item.title}
              </h4>
              <p className="text-white/45 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
