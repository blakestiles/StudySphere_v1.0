"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface EventFormProps {
  studyPacks: StudyPackOption[];
  selectedDate?: string;
  onSaved: () => void;
  onCancel: () => void;
}

const COLOR_PRESETS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "Red", value: "#ef4444" },
];

const DURATION_PRESETS = [30, 45, 60, 90];

export default function EventForm({
  studyPacks,
  selectedDate,
  onSaved,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState("#3b82f6");
  const [studyPackId, setStudyPackId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/study-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: new Date(date).toISOString(),
          startTime,
          duration,
          color,
          studyPackId: studyPackId || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");

      toast.success("Session created!");
      onSaved();
    } catch {
      toast.error("Failed to create session.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Review Chapter 5"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-date">Date</Label>
          <Input
            id="event-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-time">Start Time</Label>
          <Input
            id="event-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDuration(preset)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                duration === preset
                  ? "border-orange-500 bg-orange-500/20 text-orange-400"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {preset} min
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setColor(c.value)}
              className="h-7 w-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c.value,
                borderColor: color === c.value ? "white" : "transparent",
                transform: color === c.value ? "scale(1.15)" : "scale(1)",
                boxShadow: color === c.value ? `0 0 8px ${c.value}66` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {studyPacks.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="event-pack">Study Pack (optional)</Label>
          <select
            id="event-pack"
            value={studyPackId}
            onChange={(e) => setStudyPackId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">None</option>
            {studyPacks.map((sp) => (
              <option key={sp._id} value={sp._id}>
                {sp.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="event-desc">Description (optional)</Label>
        <Textarea
          id="event-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will you study?"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Session"}
        </button>
      </div>
    </form>
  );
}
