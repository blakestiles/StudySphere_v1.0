"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Trash2, Download, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CheatSheetItem {
  _id: string;
  title: string;
  pages: number;
  content: string;
  createdAt: string;
}

interface Props {
  studyPackId: string;
  packTitle: string;
}

export default function CheatSheetTab({ studyPackId, packTitle }: Props) {
  const [sheets, setSheets] = useState<CheatSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<CheatSheetItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/cheat-sheets?packId=${studyPackId}`)
      .then((r) => r.json())
      .then((data) => setSheets(Array.isArray(data) ? data : []))
      .catch(() => setSheets([]))
      .finally(() => setLoading(false));
  }, [studyPackId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/study-packs/${studyPackId}/cheat-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const result: CheatSheetItem = await res.json();
      setSheets((prev) => [result, ...prev]);
      setModalOpen(false);
      toast.success("Cheat sheet generated!");
    } catch {
      toast.error("Failed to generate cheat sheet");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cheat-sheets/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSheets((prev) => prev.filter((s) => s._id !== deleteId));
      if (viewing?._id === deleteId) setViewing(null);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete cheat sheet");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function handleDownload(sheet: CheatSheetItem) {
    const blob = new Blob([sheet.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheet.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // ── Viewer ──────────────────────────────────────────────────────────────

  if (viewing) {
    return (
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setViewing(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(viewing)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </button>
            <button
              onClick={() => setDeleteId(viewing._id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
          <div className="p-5 sm:p-6 border-b border-border/40">
            <h2 className="font-display text-lg font-bold text-foreground mb-1">{viewing.title}</h2>
            <span className="text-xs text-muted-foreground/60">
              {viewing.pages}-page cheat sheet · {formatDate(viewing.createdAt)}
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewing.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete cheat sheet?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-60 transition-opacity"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header row (only when there are sheets) */}
      {!loading && sheets.length > 0 && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:shadow-[0_4px_14px_oklch(0.76_0.17_62_/_40%)] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate New
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        </div>
      )}

      {/* Empty state */}
      {!loading && sheets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/50">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
              <FileText className="h-6 w-6 text-amber-500/70" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No cheat sheets yet</p>
          <p className="text-xs text-muted-foreground/60 mb-5">
            Generate a condensed cheat sheet to review before your exam.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:shadow-[0_4px_14px_oklch(0.76_0.17_62_/_40%)] transition-all"
          >
            <Plus className="h-4 w-4" />
            Generate Cheat Sheet
          </button>
        </div>
      )}

      {/* Sheet list */}
      {!loading && sheets.length > 0 && (
        <div className="space-y-2">
          {sheets.map((sheet) => (
            <div
              key={sheet._id}
              className="rounded-2xl border border-border/60 bg-card overflow-hidden"
            >
              <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
                  <FileText className="h-4 w-4 text-amber-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-foreground truncate">{sheet.title}</p>
                  <p className="text-xs text-muted-foreground/60">
                    {sheet.pages} {sheet.pages === 1 ? "page" : "pages"} · {formatDate(sheet.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewing(sheet)}
                    className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setDeleteId(sheet._id)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-destructive/20 text-destructive/60 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !generating && setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold">Generate Cheat Sheet</h2>
                <button
                  onClick={() => !generating && setModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-5">How many pages?</p>

              {/* Pages segmented control */}
              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPages(n)}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                      pages === n
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 border-transparent text-white shadow-[0_2px_8px_oklch(0.76_0.17_62_/_30%)]"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] disabled:opacity-60 transition-opacity flex items-center justify-center gap-2 mb-2"
              >
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                {generating ? "Generating…" : "Generate"}
              </button>
              <button
                onClick={() => !generating && setModalOpen(false)}
                disabled={generating}
                className="w-full rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete cheat sheet?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-60 transition-opacity"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
