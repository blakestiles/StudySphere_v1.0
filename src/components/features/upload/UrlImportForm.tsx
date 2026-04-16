"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link, Loader2, CheckCircle2, Youtube } from "lucide-react";
import { toast } from "sonner";

export default function UrlImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/documents/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setDone(true);
      toast.success("Content imported successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card hover:border-amber-500/30 transition-all duration-300">
      <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-xl bg-amber-500/15" />
          <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
            isYouTube
              ? "bg-amber-500/12 border-amber-500/30 text-amber-500"
              : "bg-amber-500/8 border-amber-500/20 text-amber-500/80"
          }`}>
            {isYouTube
              ? <Youtube className="w-7 h-7" />
              : <Link className="w-7 h-7" />
            }
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="font-display text-lg font-semibold text-foreground">Import from URL</p>
          <p className="text-sm text-muted-foreground mt-1.5">
            Paste a YouTube video URL or any article / webpage
          </p>
        </div>

        {/* Input */}
        <div className="w-full max-w-md space-y-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleImport()}
            placeholder="https://youtube.com/watch?v=... or https://..."
            className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10 placeholder:text-muted-foreground/40"
          />

          {/* Badge row */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/50">
            {["YouTube", "Articles", "Blog posts", "Wikipedia"].map((tag) => (
              <span key={tag} className="rounded-md border border-border/40 bg-muted/30 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={loading || !url.trim() || done}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {done ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Imported!
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                {isYouTube ? <Youtube className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                Import Content
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
