"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
  badge?: number;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  className?: string;
  defaultTab?: string;
}

export function AnimatedTabs({ tabs, className, defaultTab }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn("w-full", className)}>
      {/* Tab bar */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/50 w-fit min-w-full sm:min-w-0 sm:mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150 whitespace-nowrap shrink-0",
                  isActive
                    ? "text-white dark:text-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="animated-tab-indicator"
                    className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-[0_2px_8px_oklch(0.76_0.17_62_/_35%)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white dark:text-black dark:bg-black/20"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AnimatedTabs;
