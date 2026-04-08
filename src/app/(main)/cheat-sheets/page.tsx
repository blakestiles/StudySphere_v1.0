"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  FileText, Trash2, Download, ArrowLeft, Plus, Loader2, BookOpen, X,
  Presentation, Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TextShimmer from "@/components/ui/text-shimmer";
import CustomSelect from "@/components/ui/custom-select";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface CheatSheetItem {
  _id: string;
  studyPackId: string;
  packTitle: string;
  title: string;
  pages: number;
  content: string;
  createdAt: string;
}

interface StudyPackOption {
  _id: string;
  title: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function RowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-muted/50 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted/50" />
        <div className="h-2.5 w-1/3 rounded bg-muted/30" />
      </div>
    </div>
  );
}

export default function CheatSheetsPage() {
  const [sheets, setSheets] = useState<CheatSheetItem[]>([]);
  const [packs, setPacks] = useState<StudyPackOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<CheatSheetItem | null>(null);

  // Generate modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [pages, setPages] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Export state
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/cheat-sheets").then(r => r.json()),
      fetch("/api/study-packs").then(r => r.json()),
    ]).then(([sheetsData, packsData]) => {
      setSheets(Array.isArray(sheetsData) ? sheetsData : []);
      const readyPacks = Array.isArray(packsData)
        ? packsData
            .filter((p: any) => p.status === "ready")
            .map((p: any) => ({ _id: String(p._id), title: p.title as string }))
        : [];
      setPacks(readyPacks);
      if (readyPacks.length > 0) setSelectedPackId(readyPacks[0]._id);
    }).catch(() => {
      setSheets([]);
      setPacks([]);
    }).finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selectedPackId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/study-packs/${selectedPackId}/cheat-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      // API returns cheatSheet, re-fetch to get packTitle populated
      const refreshed = await fetch("/api/cheat-sheets").then(r => r.json());
      setSheets(Array.isArray(refreshed) ? refreshed : []);
      setModalOpen(false);
      toast.success("Cheat sheet generated!");
      // Open the new sheet immediately
      if (Array.isArray(refreshed) && refreshed.length > 0) {
        const newSheet = refreshed.find((s: CheatSheetItem) => s._id === String(data.cheatSheet?._id));
        if (newSheet) setViewing(newSheet);
      }
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
      setSheets(prev => prev.filter(s => s._id !== deleteId));
      if (viewing?._id === deleteId) setViewing(null);
      toast.success("Cheat sheet deleted");
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

  async function handleExportPptx(sheet: CheatSheetItem) {
    setExportingId(sheet._id);
    try {
      const res = await fetch(`/api/cheat-sheets/${sheet._id}/export?format=pptx`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sheet.title}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export PPTX");
    } finally {
      setExportingId(null);
    }
  }

  function handlePrint(sheet: CheatSheetItem) {
    window.open(`/cheat-sheets/${sheet._id}/print`, "_blank");
  }

  // ── Viewer ────────────────────────────────────────────────────────────────

  if (viewing) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setViewing(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Cheat Sheets
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => handleDownload(viewing)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </button>
            <button
              onClick={() => handleExportPptx(viewing)}
              disabled={exportingId === viewing._id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-60 transition-all"
            >
              {exportingId === viewing._id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Presentation className="h-3.5 w-3.5" />}
              Export PPTX
            </button>
            <button
              onClick={() => handlePrint(viewing)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              Print PDF
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

        {/* Content */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
          <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-1">
              <BookOpen className="h-3 w-3" />
              <span>{viewing.packTitle}</span>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">{viewing.title}</h2>
            <span className="text-xs text-muted-foreground/60">
              {viewing.pages}-page cheat sheet · {formatDate(viewing.createdAt)}
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{viewing.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete cheat sheet?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-2 transition-colors">
                {deleting ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Deleting…</> : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Cheat Sheets
          </TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${sheets.length} cheat sheet${sheets.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!loading && packs.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500/30 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] hover:shadow-[0_4px_16px_oklch(0.76_0.17_62_/_40%)] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate New
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* No packs available */}
      {!loading && packs.length === 0 && sheets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/50">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
              <FileText className="h-7 w-7 text-amber-500/50" />
            </div>
          </div>
          <h3 className="mb-1.5 font-display text-base font-semibold">No study packs yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Upload a document and generate a study pack first, then come back to create a cheat sheet.
          </p>
        </div>
      )}

      {/* Empty state — packs exist but no sheets */}
      {!loading && packs.length > 0 && sheets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/50">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
              <FileText className="h-7 w-7 text-amber-500/50" />
            </div>
          </div>
          <h3 className="mb-1.5 font-display text-base font-semibold">No cheat sheets yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
            Generate a condensed cheat sheet from any study pack to review before your exam.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)] hover:shadow-[0_4px_16px_oklch(0.76_0.17_62_/_40%)] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Cheat Sheet
          </button>
        </div>
      )}

      {/* Sheet list */}
      {!loading && sheets.length > 0 && (
        <AnimatePresence>
          <div className="space-y-2">
            {sheets.map((sheet, i) => (
              <motion.div
                key={sheet._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden"
              >
                <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
                    <FileText className="h-4.5 w-4.5 text-amber-500/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground truncate">{sheet.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BookOpen className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <span className="text-[11px] text-muted-foreground/50 truncate">{sheet.packTitle}</span>
                      <span className="text-muted-foreground/25">·</span>
                      <span className="text-[11px] text-muted-foreground/50 shrink-0">
                        {sheet.pages}p · {formatDate(sheet.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewing(sheet)}
                      className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDownload(sheet)}
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/50 hover:border-border hover:text-foreground transition-all"
                      aria-label="Download .md"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleExportPptx(sheet)}
                      disabled={exportingId === sheet._id}
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/50 hover:border-border hover:text-foreground disabled:opacity-60 transition-all"
                      aria-label="Export PPTX"
                    >
                      {exportingId === sheet._id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Presentation className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handlePrint(sheet)}
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/50 hover:border-border hover:text-foreground transition-all"
                      aria-label="Print PDF"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(sheet._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-destructive/20 text-destructive/50 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Generate modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !generating && setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Generate Cheat Sheet</h2>
                <button onClick={() => !generating && setModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted/50 transition-colors" disabled={generating}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Pack selector */}
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Study Pack</label>
              <div className="mb-4">
                <CustomSelect
                  value={selectedPackId}
                  onValueChange={setSelectedPackId}
                  options={packs.map(p => ({ value: p._id, label: p.title }))}
                  placeholder="Select a study pack…"
                  disabled={generating}
                />
              </div>

              {/* Pages selector */}
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">How many pages?</label>
              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setPages(n)}
                    disabled={generating}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                      pages === n
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 border-transparent text-white shadow-[0_2px_8px_oklch(0.76_0.17_62_/_30%)]"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !selectedPackId}
                className="w-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] disabled:opacity-60 flex items-center justify-center gap-2 mb-2 transition-opacity"
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

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete cheat sheet?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">&ldquo;{sheets.find(s => s._id === deleteId)?.title}&rdquo;</span> will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-2 transition-colors">
              {deleting ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Deleting…</> : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
