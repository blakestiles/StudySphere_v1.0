"use client";

import { Select } from "radix-ui";
import { ChevronDown, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// 30-min interval slots: 12:00 AM … 11:30 PM
const TIME_SLOTS: { label: string; value: string }[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const value = `${hh}:${mm}`;
    const period = h < 12 ? "AM" : "PM";
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const label = `${displayH}:${mm} ${period}`;
    TIME_SLOTS.push({ label, value });
  }
}

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  disabled,
  className,
}: TimePickerProps) {
  const selectedLabel = value
    ? TIME_SLOTS.find((s) => s.value === value)?.label ?? value
    : null;

  return (
    <Select.Root value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-left",
          "border border-white/10 bg-white/5 backdrop-blur-sm",
          "transition-all duration-200 cursor-pointer",
          "hover:border-amber-500/30 hover:bg-white/[0.08]",
          "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15",
          "data-[state=open]:border-amber-500/50 data-[state=open]:ring-2 data-[state=open]:ring-amber-500/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "[&>span]:truncate [&>span]:text-left",
          className
        )}
      >
        <Clock className="h-4 w-4 shrink-0 text-amber-400/60" />
        <Select.Value placeholder={<span className="text-muted-foreground/50">{placeholder}</span>}>
          {selectedLabel}
        </Select.Value>
        <Select.Icon asChild>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-amber-400/60 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
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
          <Select.ScrollUpButton className="flex items-center justify-center py-1 text-white/40 hover:text-white/70">
            <ChevronDown className="h-4 w-4 rotate-180" />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1.5 max-h-60">
            {TIME_SLOTS.map((slot) => (
              <Select.Item
                key={slot.value}
                value={slot.value}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg",
                  "px-3 py-2 pr-9 text-sm outline-none",
                  "text-white/60 transition-colors duration-100",
                  "hover:bg-amber-500/10 hover:text-white",
                  "focus:bg-amber-500/10 focus:text-white",
                  "data-[state=checked]:text-amber-300 data-[state=checked]:bg-amber-500/[0.12]",
                )}
              >
                <Select.ItemText>{slot.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex items-center justify-center py-1 text-white/40 hover:text-white/70">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
