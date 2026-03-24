"use client";

import { useState, useEffect, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import EventForm from "./EventForm";
import ShimmerButton from "@/components/ui/shimmer-button";
import BlurFade from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface StudyEventData {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  duration: number;
  color: string;
  completed: boolean;
  isAiGenerated: boolean;
  studyPackId?: { _id: string; title: string } | string | null;
}

interface StudyCalendarProps {
  studyPacks: StudyPackOption[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── SVG Icons ──────────────────────────────────────── */

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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────── */

export default function StudyCalendar({ studyPacks }: StudyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<StudyEventData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await fetch(`/api/study-events?month=${monthStr}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getEventsForDay(day: Date): StudyEventData[] {
    return events.filter((e) => isSameDay(new Date(e.date), day));
  }

  async function toggleCompleted(eventId: string, currentCompleted: boolean) {
    try {
      const res = await fetch(`/api/study-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (!res.ok) throw new Error();
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId ? { ...e, completed: !currentCompleted } : e
        )
      );
    } catch {
      toast.error("Failed to update event.");
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      const res = await fetch(`/api/study-events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      toast.success("Event deleted.");
    } catch {
      toast.error("Failed to delete event.");
    }
  }

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Count total events this month
  const monthEventCount = events.length;
  const completedCount = events.filter((e) => e.completed).length;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
      {/* ── Left: Calendar Grid ──────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Calendar Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {format(currentMonth, "MMMM")}{" "}
            <span className="font-normal text-muted-foreground">{format(currentMonth, "yyyy")}</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-full border border-border/70 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-orange-500/40 hover:bg-orange-500/8 hover:text-orange-600 dark:hover:text-orange-400"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-full border border-border/70 p-2 text-muted-foreground transition-all hover:border-orange-500/30 hover:bg-muted hover:text-foreground"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-full border border-border/70 p-2 text-muted-foreground transition-all hover:border-orange-500/30 hover:bg-muted hover:text-foreground"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const hasEvents = dayEvents.length > 0;
              const completedEvents = dayEvents.filter((e) => e.completed).length;
              const allDone = hasEvents && completedEvents === dayEvents.length;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex min-h-[76px] flex-col items-center gap-0.5 border-b border-r border-border/40 px-1 py-2.5 transition-all duration-150 sm:min-h-[84px]",
                    !inCurrentMonth ? "text-muted-foreground/25" : "text-foreground",
                    isSelected ? "bg-orange-500/8 dark:bg-orange-500/10" : "hover:bg-muted/60"
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                      today && "bg-orange-500 font-bold text-white shadow-md shadow-orange-500/30",
                      isSelected && !today && "bg-orange-500/15 font-semibold text-orange-600 ring-1 ring-orange-500/30 dark:text-orange-400",
                      !today && !isSelected && inCurrentMonth && "hover:bg-muted"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event pills */}
                  {hasEvents && (
                    <div className="flex w-full items-center justify-center gap-0.5 px-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e._id}
                          className={cn("h-1 flex-1 rounded-full", e.completed && "opacity-40")}
                          style={{ backgroundColor: e.color, maxWidth: "20px" }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] font-medium text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* All done checkmark */}
                  {allDone && (
                    <div className="absolute right-1.5 top-1.5">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
                        <CheckIcon className="h-2.5 w-2.5 text-emerald-500" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month summary */}
        <div className="mt-3 flex items-center gap-4 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500/60" />
            {monthEventCount} session{monthEventCount !== 1 ? "s" : ""} this month
          </span>
          {completedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
              {completedCount} completed
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Detail Panel ──────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {!selectedDate ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
                <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select a date</p>
              <p className="mt-1 text-xs text-muted-foreground/60">to view or add study sessions</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
                <ShimmerButton
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Session
                </ShimmerButton>
              </div>

              {/* Events List */}
              <div className="px-3 py-3">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">No sessions scheduled</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-xs font-semibold text-orange-500 hover:text-orange-400 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      + Add a study session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event, index) => {
                      const packTitle =
                        event.studyPackId &&
                        typeof event.studyPackId === "object" &&
                        event.studyPackId.title
                          ? event.studyPackId.title
                          : null;

                      return (
                        <BlurFade key={event._id} delay={index * 0.05}>
                          <div
                            className={cn(
                              "group rounded-xl border border-border/50 bg-background/60 p-3 transition-all hover:border-border",
                              event.completed && "opacity-60"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Color bar */}
                              <div
                                className="mt-1 h-full w-1 shrink-0 self-stretch rounded-full"
                                style={{ backgroundColor: event.color, minHeight: "36px" }}
                              />

                              <div className="flex-1 min-w-0">
                                {/* Title row */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "text-sm font-semibold text-foreground",
                                      event.completed && "line-through text-muted-foreground"
                                    )}
                                  >
                                    {event.title}
                                  </span>
                                  {event.isAiGenerated && (
                                    <span className="rounded-md bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400">
                                      AI
                                    </span>
                                  )}
                                </div>

                                {/* Meta */}
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                  {event.startTime && (
                                    <span className="flex items-center gap-1">
                                      <ClockIcon className="h-3 w-3" />
                                      {event.startTime}
                                    </span>
                                  )}
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">
                                    {event.duration} min
                                  </span>
                                  {packTitle && (
                                    <span className="truncate text-muted-foreground/70">{packTitle}</span>
                                  )}
                                </div>

                                {/* Description */}
                                {event.description && (
                                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/80">
                                    {event.description}
                                  </p>
                                )}

                                {/* Actions */}
                                <div className="mt-2.5 flex items-center gap-1.5">
                                  <button
                                    onClick={() => toggleCompleted(event._id, event.completed)}
                                    className={cn(
                                      "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                                      event.completed
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                                    )}
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                    {event.completed ? "Done" : "Mark done"}
                                  </button>
                                  <button
                                    onClick={() => deleteEvent(event._id)}
                                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </BlurFade>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Study Session</DialogTitle>
          </DialogHeader>
          <EventForm
            studyPacks={studyPacks}
            selectedDate={
              selectedDate
                ? format(selectedDate, "yyyy-MM-dd")
                : undefined
            }
            onSaved={() => {
              setShowForm(false);
              fetchEvents();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
