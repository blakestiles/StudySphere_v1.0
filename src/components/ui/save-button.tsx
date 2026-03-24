"use client";

import { motion, AnimatePresence } from "motion/react";
import { Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  isLoading?: boolean;
  isSaved?: boolean;
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
}

export function SaveButton({
  isLoading = false,
  isSaved = false,
  idleLabel = "Save",
  savingLabel = "Saving...",
  savedLabel = "Saved",
  className,
  disabled,
  ...props
}: SaveButtonProps) {
  const state = isLoading ? "saving" : isSaved ? "saved" : "idle";

  const config = {
    idle: {
      icon: <Save className="h-3.5 w-3.5" />,
      label: idleLabel,
      cls: "bg-white/[0.04] border-white/[0.09] text-white/60 hover:bg-white/[0.08] hover:border-amber-500/20 hover:text-white/90",
    },
    saving: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: savingLabel,
      cls: "bg-amber-500/[0.07] border-amber-500/15 text-amber-400/70 cursor-not-allowed",
    },
    saved: {
      icon: <Check className="h-3.5 w-3.5" />,
      label: savedLabel,
      cls: "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400",
    },
  }[state];

  return (
    <button
      disabled={state !== "idle" || disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
        "transition-all duration-300 active:scale-[0.97]",
        config.cls,
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.75, y: 3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: -3 }}
          transition={{ duration: 0.14 }}
          className="flex items-center gap-1.5"
        >
          {config.icon}
          {config.label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default SaveButton;
