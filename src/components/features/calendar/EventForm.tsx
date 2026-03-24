"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import TimePicker from "@/components/ui/time-picker";

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
          date: new Date(date + "T12:00:00").toISOString(),
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
          <Label>Date</Label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date..."
          />
        </div>
        <div className="space-y-2">
          <Label>Start Time</Label>
          <TimePicker
            value={startTime}
            onChange={setStartTime}
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
              className={
                duration === preset
                  ? "rounded-xl border border-orange-500/50 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-400 transition-all duration-150 shadow-sm shadow-orange-500/20"
                  : "rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-white/5 hover:border-white/20 hover:text-foreground"
              }
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
          <CustomSelect
            value={studyPackId}
            onValueChange={setStudyPackId}
            options={[
              { value: "", label: "None" },
              ...studyPacks.map((sp) => ({ value: sp._id, label: sp.title })),
            ]}
            placeholder="Link to study pack..."
          />
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
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/5 hover:text-foreground hover:border-white/20 active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {saving ? "Saving..." : "Create Session"}
        </button>
      </div>
    </form>
  );
}
