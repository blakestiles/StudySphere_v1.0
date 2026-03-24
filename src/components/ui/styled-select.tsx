"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  wrapperClassName?: string;
}

export default function StyledSelect({ className, wrapperClassName, children, ...props }: StyledSelectProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        className={cn(
          "w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-sm",
          "border border-white/10 bg-white/5 text-foreground",
          "backdrop-blur-sm",
          "transition-all duration-200",
          "hover:border-amber-500/30 hover:bg-white/[0.08]",
          "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15",
          "cursor-pointer [color-scheme:dark]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown className="w-4 h-4 text-amber-400/60 transition-transform duration-200" />
      </div>
    </div>
  );
}
