"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Feature {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  details: string[];
}

interface FeatureCarouselProps {
  features: Feature[];
  autoPlayInterval?: number;
  className?: string;
}

const AUTO_PLAY_INTERVAL = 3000;
const ITEM_HEIGHT = 56;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel({
  features,
  autoPlayInterval = AUTO_PLAY_INTERVAL,
  className,
}: FeatureCarouselProps) {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentIndex =
    ((step % features.length) + features.length) % features.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + features.length) % features.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextStep, isPaused, autoPlayInterval]);

  const currentFeature = features[currentIndex];
  const CurrentIcon = currentFeature.icon;

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      <div className="relative overflow-hidden rounded-3xl lg:rounded-[3rem] flex flex-col lg:flex-row min-h-[450px] lg:min-h-[500px] border border-white/[0.06] bg-[#0c0c16]">
        {/* Left panel — chip nav */}
        <div className="w-full lg:w-[38%] min-h-[200px] lg:h-full relative z-30 flex flex-col items-start justify-center overflow-hidden px-6 sm:px-10 lg:pl-10 py-8 lg:py-0 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-transparent">
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0c0c16] to-transparent z-40 pointer-events-none lg:block hidden" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0c16] to-transparent z-40 pointer-events-none lg:block hidden" />

          <div className="relative w-full h-full flex items-center z-20">
            {/* Mobile: horizontal scroll, Desktop: vertical stack */}
            <div className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-visible w-full lg:relative lg:h-[340px]">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = index === currentIndex;
                const distance = index - currentIndex;
                const wrappedDistance = wrap(
                  -(features.length / 2),
                  features.length / 2,
                  distance
                );

                return (
                  <motion.div
                    key={feature.id}
                    style={{ height: ITEM_HEIGHT }}
                    animate={{
                      y: wrappedDistance * ITEM_HEIGHT,
                      opacity: 1 - Math.abs(wrappedDistance) * 0.2,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 90,
                      damping: 22,
                      mass: 1,
                    }}
                    className="absolute hidden lg:flex items-center justify-start"
                  >
                    <button
                      onClick={() => handleChipClick(index)}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      className={cn(
                        "relative flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-500 text-left group border whitespace-nowrap",
                        isActive
                          ? "bg-amber-500 text-black border-amber-500 z-10 shadow-lg shadow-amber-500/20"
                          : "bg-transparent text-white/50 border-white/10 hover:border-white/25 hover:text-white/70"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-black" : "text-white/40"
                        )}
                      />
                      <span className="font-medium text-sm tracking-tight">
                        {feature.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}

              {/* Mobile chips */}
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = index === currentIndex;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "lg:hidden flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-amber-500 text-black border-amber-500"
                        : "bg-transparent text-white/50 border-white/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium">
                      {feature.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel — feature detail */}
        <div className="flex-1 relative flex items-center justify-center p-8 sm:p-12 lg:p-16 border-t lg:border-t-0 lg:border-l border-white/[0.04]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
                mass: 0.8,
              }}
              className="w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-500/60 font-mono uppercase tracking-widest mb-1">
                    Feature {currentIndex + 1} of {features.length}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                    {currentFeature.label}
                  </h3>
                </div>
              </div>

              <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-6">
                {currentFeature.description}
              </p>

              <div className="space-y-3">
                {currentFeature.details.map((detail, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-2 shrink-0" />
                    <span className="text-white/40 text-sm">{detail}</span>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-8 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  key={step}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: autoPlayInterval / 1000,
                    ease: "linear",
                  }}
                  className="h-full bg-gradient-to-r from-amber-500/60 to-amber-500 rounded-full"
                  style={isPaused ? { animationPlayState: "paused" } : {}}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
