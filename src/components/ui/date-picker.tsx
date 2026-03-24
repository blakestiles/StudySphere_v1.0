"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  value?: string; // "yyyy-MM-dd"
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // "yyyy-MM-dd"
  disabled?: boolean;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (value) return new Date(value + "T00:00:00");
    return new Date();
  });

  const selected = value ? new Date(value + "T00:00:00") : null;
  const minDate = min ? startOfDay(new Date(min + "T00:00:00")) : null;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  function handleSelect(day: Date) {
    if (minDate && isBefore(day, minDate)) return;
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-left",
            "border border-white/10 bg-white/5 backdrop-blur-sm",
            "transition-all duration-200 cursor-pointer",
            "hover:border-amber-500/30 hover:bg-white/[0.08]",
            "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15",
            "data-[state=open]:border-amber-500/50 data-[state=open]:ring-2 data-[state=open]:ring-amber-500/15",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-amber-400/60" />
          <span className={selected ? "text-foreground" : "text-muted-foreground/50"}>
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={cn(
            "z-[9999] w-72 overflow-hidden",
            "rounded-2xl border border-white/10 bg-[#0c0c16]/95 backdrop-blur-2xl",
            "shadow-2xl shadow-black/60",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "duration-150"
          )}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white/80"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white/90">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white/80"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-white/8 px-2 pt-2 pb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/25">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 p-2">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = selected && isSameDay(day, selected);
              const todayDay = isToday(day);
              const disabled = minDate ? isBefore(day, minDate) : false;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-sm transition-all",
                    !inMonth && "text-white/15",
                    inMonth && !isSelected && !todayDay && !disabled && "text-white/60 hover:bg-amber-500/10 hover:text-white",
                    todayDay && !isSelected && "text-amber-400 font-semibold",
                    isSelected && "bg-amber-500 font-bold text-black shadow-md shadow-amber-500/30",
                    disabled && "cursor-not-allowed opacity-25"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="border-t border-white/8 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (minDate && isBefore(today, minDate)) return;
                onChange(format(today, "yyyy-MM-dd"));
                setOpen(false);
              }}
              className="w-full rounded-lg py-1.5 text-xs font-semibold text-amber-400/70 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
            >
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}
