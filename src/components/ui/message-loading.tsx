"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
} as const;

interface MessageLoadingProps {
  className?: string;
  dotClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function MessageLoading({
  className,
  dotClassName,
  size = "md",
}: MessageLoadingProps) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-full bg-amber-500",
            sizeClasses[size],
            dotClassName
          )}
          animate={{ y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

interface MessageLoadingBubbleProps {
  className?: string;
  showAvatar?: boolean;
  avatarIcon?: React.ReactNode;
}

export function MessageLoadingBubble({
  className,
  showAvatar = true,
  avatarIcon,
}: MessageLoadingBubbleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3",
        className
      )}
    >
      {showAvatar && (
        <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500">
          {avatarIcon ?? <Sparkles className="h-3.5 w-3.5 text-white" />}
        </div>
      )}
      <MessageLoading />
    </div>
  );
}

export default MessageLoading;
