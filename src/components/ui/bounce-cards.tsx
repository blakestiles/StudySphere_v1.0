"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface BounceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  className?: string;
}

function BounceCard({ icon: Icon, title, description, gradient, className }: BounceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 0.95, rotate: "-1deg" }}
      className={cn(
        "group relative min-h-[280px] cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c16] p-8",
        className
      )}
    >
      <div className="relative z-10 mb-20">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4 border border-white/[0.06]">
          <Icon className="w-5 h-5 text-amber-500" />
        </div>
        <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-4 right-4 top-36 translate-y-8 rounded-t-2xl p-6 transition-transform duration-300 ease-out group-hover:translate-y-4 group-hover:rotate-[2deg]",
          gradient
        )}
      >
        <span className="block text-center text-sm font-medium text-white/90">
          {description}
        </span>
      </div>
    </motion.div>
  );
}

interface BounceCardsGridProps {
  cards: BounceCardProps[];
  className?: string;
}

export function BounceCardsGrid({ cards, className }: BounceCardsGridProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-12 gap-4">
        {cards.slice(0, 2).map((card, i) => (
          <BounceCard
            key={card.title}
            {...card}
            className={cn(
              i === 0 ? "col-span-12 md:col-span-4" : "col-span-12 md:col-span-8",
              card.className
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        {cards.slice(2, 4).map((card, i) => (
          <BounceCard
            key={card.title}
            {...card}
            className={cn(
              i === 0 ? "col-span-12 md:col-span-8" : "col-span-12 md:col-span-4",
              card.className
            )}
          />
        ))}
      </div>
    </div>
  );
}

export { BounceCard };
export default BounceCardsGrid;
