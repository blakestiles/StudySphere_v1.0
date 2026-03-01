"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface FluidTabsProps {
  tabs: { label: string; value: string }[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export default function FluidTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: FluidTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.value === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className={cn("relative inline-flex rounded-full bg-muted p-1", className)}>
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-orange-500/20 border border-orange-500/30"
        animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      {tabs.map((tab, i) => (
        <button
          key={tab.value}
          ref={(el) => { tabsRef.current[i] = el; }}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors",
            activeTab === tab.value
              ? "text-orange-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
