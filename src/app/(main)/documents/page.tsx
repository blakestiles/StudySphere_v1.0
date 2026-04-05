"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FileText, FileType, Upload, Search, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TextShimmer from "@/components/ui/text-shimmer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DocumentData {
  _id: string;
  title: string;
  fileType: string;
  uploadedAt: string;
  status: string;
}

function groupByDate(docs: DocumentData[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: DocumentData[] = [];
  const thisWeek: DocumentData[] = [];
  const earlier: DocumentData[] = [];

  for (const doc of docs) {
    const d = new Date(doc.uploadedAt);
    if (d >= todayStart) today.push(doc);
    else if (d >= weekStart) thisWeek.push(doc);
    else earlier.push(doc);
  }

  return [
    { label: "Today", docs: today },
    { label: "This Week", docs: thisWeek },
    { label: "Earlier", docs: earlier },
  ].filter((g) => g.docs.length > 0);
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-muted/50 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted/50" />
        <div className="h-2.5 w-1/3 rounded bg-muted/30" />
      </div>
      <div className="w-8 h-4 rounded bg-muted/30" />
    </div>
  );
}

function DocRow({ doc, index, onDelete }: { doc: DocumentData; index: number; onDelete: (id: string) => void }) {
  const isPDF = doc.fileType === "pdf";
  const date = new Date(doc.uploadedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative group/row"
    >
      <Link href={`/documents/${doc._id}`} className="group flex items-center gap-4 px-4 py-3 pr-12 rounded-xl hover:bg-muted/40 transition-all duration-150 relative">
        {/* Left accent bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-0 group-hover:h-[55%] rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500 transition-all duration-200" />

        {/* Icon */}
        <div className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
          isPDF
            ? "bg-blue-500/8 border-blue-500/15 text-blue-500 group-hover:bg-blue-500/12 group-hover:border-blue-500/25"
            : "bg-emerald-500/8 border-emerald-500/15 text-emerald-500 group-hover:bg-emerald-500/12 group-hover:border-emerald-500/25"
        }`}>
          {isPDF
            ? <FileText className="w-4 h-4" />
            : <FileType className="w-4 h-4" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium text-foreground truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-150">
            {doc.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground/50 tabular-nums">{date}</span>
            <span className="text-muted-foreground/25">·</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/40">{doc.fileType}</span>
          </div>
        </div>

        {/* Right: status + arrow */}
        <div className="flex items-center gap-2 shrink-0">
          {doc.status !== "ready" && (
            <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 ${
              doc.status === "processing"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              {doc.status === "processing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot mr-1.5 inline-block" />
              )}
              {doc.status}
            </Badge>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-amber-500/60 group-hover:translate-x-0.5 transition-all duration-150" />
        </div>
      </Link>

      {/* Delete button — outside Link so it doesn't navigate */}
      <button
        onClick={() => onDelete(doc._id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg border border-transparent text-muted-foreground/0 group-hover/row:border-border/50 group-hover/row:text-muted-foreground/40 hover:!border-red-500/40 hover:!bg-red-500/8 hover:!text-red-500 transition-all duration-150 z-10"
        aria-label="Delete document"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete document");
        return;
      }
      setDocuments(prev => prev.filter(d => d._id !== deleteId));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return documents;
    const q = query.toLowerCase();
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, query]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const deleteTitle = documents.find(d => d._id === deleteId)?.title;

  return (
    <>
    <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete document?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">&ldquo;{deleteTitle}&rdquo;</span> and any study packs generated from it will be permanently deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={() => setDeleteId(null)}
            disabled={deleting}
            className="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Documents</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${documents.length} document${documents.length !== 1 ? "s" : ""} in your library`}
          </p>
        </div>
        <Link href="/upload" className="shrink-0 mt-1">
          <button className="chip-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500/30 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)]">
            <Upload className="h-3.5 w-3.5 text-white/90" />
            Upload New
          </button>
        </Link>
      </div>

      {/* Search */}
      {!loading && documents.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : documents.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/50">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5">
              <FileText className="h-7 w-7 text-amber-500/50" />
            </div>
          </div>
          <h3 className="mb-1.5 font-display text-base font-semibold">No documents yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
            Upload a PDF or paste text to start building your study library.
          </p>
          <Link href="/upload">
            <button className="chip-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500/30 shadow-[0_2px_12px_oklch(0.76_0.17_62_/_30%)]">
              <Upload className="h-3.5 w-3.5 text-white/90" />
              Upload Document
            </button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        /* No search results */
        <div className="py-16 text-center rounded-2xl border border-border/40">
          <p className="text-sm font-medium text-foreground mb-1">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        /* Document groups */
        <AnimatePresence>
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Group label */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40">{group.label}</span>
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground/30 tabular-nums">{group.docs.length}</span>
                </div>

                {/* Rows */}
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
                  {group.docs.map((doc, i) => (
                    <DocRow key={doc._id} doc={doc} index={i} onDelete={setDeleteId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
    </>
  );
}
