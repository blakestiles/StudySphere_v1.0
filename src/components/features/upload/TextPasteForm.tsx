"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function TextPasteForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (content.length < 10) {
      toast.error("Content must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }

      setDone(true);
      toast.success("Text saved successfully!");
      setTimeout(() => {
        setTitle("");
        setContent("");
        setDone(false);
      }, 1500);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Title field */}
        <div className="px-5 pt-5 pb-4">
          <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
            Document Title
          </label>
          <input
            type="text"
            placeholder="e.g., Chapter 5 — Data Structures"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/40" />

        {/* Content field */}
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
              Study Content
            </label>
            <span className={`text-[11px] tabular-nums font-medium transition-colors ${
              content.length > 0 ? "text-amber-500/80" : "text-muted-foreground/40"
            }`}>
              {content.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            placeholder="Paste your study material here — lecture notes, textbook excerpts, articles…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            required
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Footer with submit */}
        <div className="border-t border-border/40 px-5 py-4 bg-muted/20 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">
            Content will be processed into a searchable document
          </p>
          <button
            type="submit"
            disabled={loading || done}
            className={`chip-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border shrink-0 transition-all ${
              done
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500/30 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] disabled:opacity-60"
            }`}
          >
            {done ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved!
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Document"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
