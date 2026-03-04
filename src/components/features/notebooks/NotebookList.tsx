"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

export default function NotebookList({ notebooks: initial, studyPacks }: NotebookListProps) {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState(initial);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = notebooks.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const createNotebook = async () => {
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

  const deleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this notebook?")) return;
    try {
      const res = await fetch(`/api/notebooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotebooks((prev) => prev.filter((n) => n._id !== id));
        toast.success("Notebook deleted");
      }
    } catch {
      toast.error("Failed to delete notebook");
    }
  };

  const getPackName = (packId?: string) => {
    if (!packId) return null;
    const pack = studyPacks.find((sp) => sp._id === packId);
    return pack?.title || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notebooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <button
          onClick={createNotebook}
          disabled={creating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Notebook
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">
            {search ? "No notebooks match your search" : "No notebooks yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((notebook) => (
            <div
              key={notebook._id}
              onClick={() => router.push(`/notebooks/${notebook._id}`)}
              className="group relative rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-orange-500/30 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-foreground truncate pr-8">
                {notebook.title}
              </h3>
              {getPackName(notebook.studyPackId) && (
                <p className="text-xs text-orange-500 mt-1 truncate">
                  {getPackName(notebook.studyPackId)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Updated {formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })}
              </p>
              <button
                onClick={(e) => deleteNotebook(notebook._id, e)}
                className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
