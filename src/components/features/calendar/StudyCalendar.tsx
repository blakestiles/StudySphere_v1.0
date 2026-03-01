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
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* ── Left: Calendar Grid ──────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Calendar Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-medium text-muted-foreground"
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
                  className={`relative flex min-h-[72px] flex-col items-center border-b border-r border-border py-2 transition-colors sm:min-h-[80px] ${
                    !inCurrentMonth
                      ? "text-muted-foreground/30"
                      : "text-foreground"
                  } ${
                    isSelected
                      ? "bg-orange-500/10"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                      today
                        ? "bg-orange-500 font-bold text-white"
                        : isSelected
                        ? "font-semibold text-orange-400"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {dayEvents.slice(0, 4).map((e) => (
                        <span
                          key={e._id}
                          className={`h-1.5 w-1.5 rounded-full ${e.completed ? "opacity-40" : ""}`}
                          style={{ backgroundColor: e.color }}
                        />
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="ml-0.5 text-[8px] text-muted-foreground">
                          +{dayEvents.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* All done indicator */}
                  {allDone && (
                    <div className="absolute right-1 top-1">
                      <CheckIcon className="h-3 w-3 text-emerald-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month summary */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{monthEventCount} session{monthEventCount !== 1 ? "s" : ""} this month</span>
          {completedCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckIcon className="h-3 w-3 text-emerald-500" />
              {completedCount} completed
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Detail Panel ──────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96">
        <div className="rounded-xl border border-border bg-card">
          {!selectedDate ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-xl border border-border bg-muted/50 p-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Select a date to view or add sessions
              </p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white transition-colors hover:bg-orange-600"
                  title="Add session"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Events List */}
              <div className="px-4 py-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No sessions scheduled</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-xs font-medium text-orange-400 hover:text-orange-300"
                    >
                      + Add a study session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((event) => {
                      const packTitle =
                        event.studyPackId &&
                        typeof event.studyPackId === "object" &&
                        event.studyPackId.title
                          ? event.studyPackId.title
                          : null;

                      return (
                        <div
                          key={event._id}
                          className={`group rounded-lg border border-border p-3 transition-colors ${
                            event.completed ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Color indicator */}
                            <div
                              className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: event.color }}
                            />

                            <div className="flex-1 min-w-0">
                              {/* Title row */}
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium text-foreground ${
                                    event.completed ? "line-through text-muted-foreground" : ""
                                  }`}
                                >
                                  {event.title}
                                </span>
                                {event.isAiGenerated && (
                                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
                                    AI
                                  </span>
                                )}
                              </div>

                              {/* Meta */}
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {event.startTime && (
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {event.startTime}
                                  </span>
                                )}
                                <span>{event.duration} min</span>
                                {packTitle && (
                                  <>
                                    <span className="text-border">|</span>
                                    <span className="truncate">{packTitle}</span>
                                  </>
                                )}
                              </div>

                              {/* Description */}
                              {event.description && (
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                            <button
                              onClick={() => toggleCompleted(event._id, event.completed)}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                event.completed
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                              }`}
                            >
                              <CheckIcon className="h-3 w-3" />
                              {event.completed ? "Completed" : "Mark done"}
                            </button>
                            <button
                              onClick={() => deleteEvent(event._id)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                            >
                              <TrashIcon className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </div>
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
