"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className,
}: SpotlightCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-xl border border-white/[0.08] bg-[#111827] overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
