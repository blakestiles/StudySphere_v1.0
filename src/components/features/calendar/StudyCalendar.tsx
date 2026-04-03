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
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Clock,
  Trash2,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import EventForm from "./EventForm";
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
  const monthEventCount = events.length;
  const completedCount = events.filter((e) => e.completed).length;
  const completionPct = monthEventCount > 0 ? Math.round((completedCount / monthEventCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-5">
      {/* ── Left: Calendar ───────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Month nav */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {format(currentMonth, "MMMM")}{" "}
            <span className="font-normal text-muted-foreground">{format(currentMonth, "yyyy")}</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-amber-500/40 hover:bg-amber-500/8 hover:text-amber-600 dark:hover:text-amber-400"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
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
              const allDone = hasEvents && dayEvents.every((e) => e.completed);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex min-h-[72px] flex-col items-center gap-1 border-b border-r border-border/40 px-1 py-2 transition-all duration-150 sm:min-h-[80px]",
                    !inCurrentMonth ? "text-muted-foreground/25" : "text-foreground",
                    isSelected ? "bg-amber-500/[0.07]" : "hover:bg-muted/50"
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-all",
                      today && "bg-amber-500 font-bold text-white shadow-md shadow-amber-500/30",
                      isSelected && !today && "bg-amber-500/15 font-semibold text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400",
                      !today && !isSelected && inCurrentMonth && "hover:bg-muted"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event dots */}
                  {hasEvents && (
                    <div className="flex items-center justify-center gap-0.5 px-1 w-full">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e._id}
                          className={cn("h-1 flex-1 rounded-full", e.completed && "opacity-40")}
                          style={{ backgroundColor: e.color, maxWidth: "18px" }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] font-medium text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* All-done badge */}
                  {allDone && (
                    <div className="absolute right-1 top-1">
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20">
                        <Check className="h-2 w-2 text-emerald-500" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month summary */}
        {monthEventCount > 0 && (
          <div className="mt-3 space-y-2 px-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
                {monthEventCount} session{monthEventCount !== 1 ? "s" : ""} this month
              </span>
              <span className="text-muted-foreground/70">{completedCount}/{monthEventCount} done · {completionPct}%</span>
            </div>
            <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Detail Panel ──────────────────────── */}
      <div className="w-full lg:w-80 xl:w-[340px]">
        <AnimatePresence mode="wait">
          {!selectedDate ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-lg" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <CalendarDays className="h-7 w-7 text-amber-500" />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">Select a date</p>
              <p className="mt-1 text-xs text-muted-foreground/60">to view or schedule study sessions</p>
            </motion.div>
          ) : (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card"
            >
              {/* Amber top bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />

              {/* Panel header */}
              <div className="relative flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Session
                </button>
              </div>

              {/* Events */}
              <div className="relative px-3 py-3">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  </div>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">No sessions scheduled</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                    >
                      + Schedule a session
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
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "rounded-xl border border-border/50 bg-background/60 p-3 transition-all hover:border-border/80",
                            event.completed && "opacity-55"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Color bar */}
                            <div
                              className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
                              style={{ backgroundColor: event.color, minHeight: "36px" }}
                            />

                            <div className="flex-1 min-w-0">
                              {/* Title row */}
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[13px] font-semibold text-foreground",
                                  event.completed && "line-through text-muted-foreground"
                                )}>
                                  {event.title}
                                </span>
                                {event.isAiGenerated && (
                                  <span className="flex items-center gap-0.5 rounded-md bg-purple-500/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400 border border-purple-500/20">
                                    <Sparkles className="h-2 w-2" />AI
                                  </span>
                                )}
                              </div>

                              {/* Meta */}
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                {event.startTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.startTime}
                                  </span>
                                )}
                                <span className="rounded-md bg-muted/70 px-1.5 py-0.5 font-medium">
                                  {event.duration} min
                                </span>
                                {packTitle && (
                                  <span className="truncate text-muted-foreground/60">{packTitle}</span>
                                )}
                              </div>

                              {/* Description */}
                              {event.description && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                                  {event.description}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="mt-2 flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleCompleted(event._id, event.completed)}
                                  className={cn(
                                    "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                                    event.completed
                                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-muted/60 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                  {event.completed ? "Done" : "Mark done"}
                                </button>
                                <button
                                  onClick={() => deleteEvent(event._id)}
                                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-muted-foreground/60 transition-all hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
