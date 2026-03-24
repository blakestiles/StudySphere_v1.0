"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  maxItems?: number;
}

export function AnimatedList({
  children,
  className,
  delay = 2000,
  maxItems = 5,
}: AnimatedListProps) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % childrenArray.length);
    }, delay);
    return () => clearInterval(interval);
  }, [childrenArray.length, delay]);

  const itemsToShow = useMemo(() => {
    const result = [];
    for (let i = 0; i <= index; i++) {
      result.push(childrenArray[i % childrenArray.length]);
    }
    return result.slice(-maxItems).reverse();
  }, [index, childrenArray, maxItems]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <AnimatePresence mode="popLayout">
        {itemsToShow.map((item, i) => (
          <AnimatedListItem key={(item as React.ReactElement).key || i}>
            {item}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      layoutId={(children as React.ReactElement)?.key?.toString()}
      initial={{ scale: 0.95, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
        mass: 0.8,
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}

// Pre-built notification item for StudySphere
interface NotificationItemProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  time: string;
  color?: string;
}

export function NotificationItem({ icon, name, description, time, color = "bg-amber-500/10" }: NotificationItemProps) {
  return (
    <div className="flex items-center gap-3 w-full rounded-xl border border-white/[0.06] bg-[#0c0c16]/80 backdrop-blur-sm p-3 hover:border-white/[0.1] transition-colors">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/40 truncate">{description}</p>
      </div>
      <span className="text-[10px] text-white/25 whitespace-nowrap shrink-0">{time}</span>
    </div>
  );
}

export default AnimatedList;
