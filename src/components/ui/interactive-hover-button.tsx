"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export function InteractiveHoverButton({
  text = "Button",
  className,
  children,
  ...props
}: InteractiveHoverButtonProps) {
  const label = children ?? text;

  return (
    <button
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-7 py-2.5 text-sm font-semibold text-white/60",
        "hover:border-white/[0.12] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {/* Expanding amber fill circle */}
      <span
        className={cn(
          "absolute left-[14%] top-[25%] h-3.5 w-3.5 rounded-full bg-amber-500",
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "group-hover:left-[-5%] group-hover:top-[-20%] group-hover:h-[200%] group-hover:w-[200%]"
        )}
      />

      {/* Default label — slides out */}
      <span className="relative inline-block transition-all duration-300 group-hover:translate-x-16 group-hover:opacity-0">
        {label}
      </span>

      {/* Hover label + arrow — slides in */}
      <div className="absolute inset-0 z-10 flex translate-x-[-100%] items-center justify-center gap-1.5 text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span className="font-semibold">{label}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

export default InteractiveHoverButton;
