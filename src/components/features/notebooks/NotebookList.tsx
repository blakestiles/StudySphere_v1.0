"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, BookOpen, Loader2, NotebookPen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface Notebook {
  _id: string;
  title: string;
  studyPackId?: string;
  updatedAt: string;
}

interface StudyPack {
  _id: string;
  title: string;
}

interface NotebookListProps {
  notebooks: Notebook[];
  studyPacks: StudyPack[];
}

// ── Color palette — rotates per card ──────────────────

const CARD_COLORS = [
  {
    topBar: "from-amber-500 via-orange-400 to-transparent",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-500",
    hoverBorder: "hover:border-amber-500/30",
    packTag: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    topBar: "from-violet-500 via-purple-400 to-transparent",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-500",
    hoverBorder: "hover:border-violet-500/30",
    packTag: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  {
    topBar: "from-blue-500 via-cyan-400 to-transparent",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-500",
    hoverBorder: "hover:border-blue-500/30",
    packTag: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    topBar: "from-emerald-500 via-green-400 to-transparent",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/30",
    packTag: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    topBar: "from-rose-500 via-pink-400 to-transparent",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-500",
    hoverBorder: "hover:border-rose-500/30",
    packTag: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
];

export default function NotebookList({ notebooks: initial, studyPacks }: NotebookListProps) {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState(initial);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = notebooks.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const createNotebook = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/notebooks/${data.notebook._id}`);
      } else {
        toast.error("Failed to create notebook");
      }
    } catch {
      toast.error("Failed to create notebook");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const deleteNotebook = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notebooks/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setNotebooks((prev) => prev.filter((n) => n._id !== deleteId));
        toast.success("Notebook deleted");
        setDeleteId(null);
      }
    } catch {
      toast.error("Failed to delete notebook");
    } finally {
      setDeleting(false);
    }
  };

  const getPackName = (packId?: string) => {
    if (!packId) return null;
    return studyPacks.find((sp) => sp._id === packId)?.title ?? null;
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search notebooks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
        </div>
        <button
          onClick={createNotebook}
          disabled={creating}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {creating
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Plus className="h-4 w-4" />
          }
          New Notebook
        </button>
      </div>

      {/* ── Count badge ───────────────────────────────── */}
      {notebooks.length > 0 && (
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[11px] text-muted-foreground/50">
            {filtered.length === notebooks.length
              ? `${notebooks.length} notebook${notebooks.length !== 1 ? "s" : ""}`
              : `${filtered.length} of ${notebooks.length} notebooks`}
          </span>
        </div>
      )}

      {/* ── Grid / Empty ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-16 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-lg" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                <NotebookPen className="h-7 w-7 text-amber-500/70" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {search ? "No notebooks found" : "No notebooks yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60 max-w-xs">
                {search
                  ? "Try a different search term."
                  : "Create your first notebook to start taking Cornell-style notes."}
              </p>
            </div>
            {!search && (
              <button
                onClick={createNotebook}
                disabled={creating}
                className="mt-1 flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Create Notebook
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map((notebook, index) => {
              const color = CARD_COLORS[index % CARD_COLORS.length];
              const packName = getPackName(notebook.studyPackId);

              return (
                <motion.div
                  key={notebook._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/notebooks/${notebook._id}`)}
                  className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card cursor-pointer transition-all duration-200 ${color.hoverBorder} hover:shadow-md`}
                >
                  {/* Top color bar */}
                  <div className={`h-[2px] bg-gradient-to-r ${color.topBar}`} />

                  <div className="p-4">
                    {/* Icon + title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${color.iconBg}`}>
                        <BookOpen className={`h-4 w-4 ${color.iconColor}`} />
                      </div>
                      <h3 className="text-[13.5px] font-semibold text-foreground leading-snug pt-0.5 pr-6 line-clamp-2">
                        {notebook.title}
                      </h3>
                    </div>

                    {/* Pack tag */}
                    {packName && (
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium mb-2.5 ${color.packTag}`}>
                        {packName}
                      </span>
                    )}

                    {/* Updated time */}
                    <p className="text-[11px] text-muted-foreground/55">
                      Updated {formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Delete button — hover reveal */}
                  <button
                    onClick={(e) => confirmDelete(notebook._id, e)}
                    className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete notebook?</DialogTitle>
            <DialogDescription>
              {deleteId && (() => {
                const nb = notebooks.find((n) => n._id === deleteId);
                return nb ? (
                  <><span className="font-medium text-foreground">&ldquo;{nb.title}&rdquo;</span> and all its notes will be permanently deleted. This cannot be undone.</>
                ) : "This notebook will be permanently deleted. This cannot be undone.";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={deleteNotebook}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
