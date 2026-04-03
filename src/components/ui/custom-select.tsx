"use client";

import { Select } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled,
  className,
}: CustomSelectProps) {
  return (
    <Select.Root value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      {/* suppressHydrationWarning: Radix generates aria-controls IDs that differ between SSR
          and client hydration (counter-based). The mismatch is purely cosmetic (ID strings only)
          and does not affect functionality or accessibility — safe to suppress. */}
      <Select.Trigger
        suppressHydrationWarning
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm",
          "border border-white/10 bg-white/5 text-foreground backdrop-blur-sm",
          "transition-all duration-200 cursor-pointer",
          "hover:border-amber-500/30 hover:bg-white/[0.08]",
          "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15",
          "data-[state=open]:border-amber-500/50 data-[state=open]:ring-2 data-[state=open]:ring-amber-500/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "[&>span]:truncate [&>span]:text-left",
          className
        )}
      >
        <Select.Value placeholder={<span className="text-white/30">{placeholder}</span>} />
        <Select.Icon asChild>
          <ChevronDown className="w-4 h-4 shrink-0 text-amber-400/60 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cn(
            "relative z-[9999] min-w-[var(--radix-select-trigger-width)] overflow-hidden",
            "rounded-xl border border-white/10 bg-[#0c0c16]/95 backdrop-blur-2xl",
            "shadow-2xl shadow-black/60",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "duration-150"
          )}
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className="p-1.5 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value || "__empty__"}
                disabled={opt.disabled}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg",
                  "px-3 py-2.5 pr-9 text-sm outline-none",
                  "text-white/60 transition-colors duration-100",
                  "hover:bg-amber-500/10 hover:text-white",
                  "focus:bg-amber-500/10 focus:text-white",
                  "data-[state=checked]:text-amber-300 data-[state=checked]:bg-amber-500/[0.12]",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-30"
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
