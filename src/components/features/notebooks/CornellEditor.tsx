"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Notebook {
  _id: string;
  title: string;
  studyPackId?: string;
  cues: string;
  notes: string;
  summary: string;
}

interface StudyPack {
  _id: string;
  title: string;
}

interface CornellEditorProps {
  notebook: Notebook;
  studyPacks: StudyPack[];
}

export default function CornellEditor({ notebook, studyPacks }: CornellEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(notebook.title);
  const [cues, setCues] = useState(notebook.cues);
  const [summary, setSummary] = useState(notebook.summary);
  const [packId, setPackId] = useState(notebook.studyPackId || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (data: Partial<{ title: string; cues: string; notes: string; summary: string; studyPackId: string }>) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/notebooks/${notebook._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          toast.error("Failed to save");
          setSaveStatus("idle");
        }
      } catch {
        toast.error("Failed to save");
        setSaveStatus("idle");
      }
    },
    [notebook._id]
  );

  const debouncedSave = useCallback(
    (data: Partial<{ title: string; cues: string; notes: string; summary: string }>) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => save(data), 2000);
    },
    [save]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start taking notes..." }),
    ],
    content: notebook.notes,
    onUpdate: ({ editor }) => {
      debouncedSave({ notes: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none p-4",
      },
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    debouncedSave({ title: val });
  };

  const handleCuesChange = (val: string) => {
    setCues(val);
    debouncedSave({ cues: val });
  };

  const handleSummaryChange = (val: string) => {
    setSummary(val);
    debouncedSave({ summary: val });
  };

  const handlePackChange = (val: string) => {
    setPackId(val);
    save({ studyPackId: val } as Record<string, string>);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/notebooks")}
          className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 bg-transparent text-xl font-bold text-foreground focus:outline-none"
          placeholder="Notebook title..."
        />
        <select
          value={packId}
          onChange={(e) => handlePackChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        >
          <option value="">No study pack</option>
          {studyPacks.map((sp) => (
            <option key={sp._id} value={sp._id}>
              {sp.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Saved
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 flex-wrap">
          {[
            { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
            { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
            { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
            { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
            { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
            { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
            { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
            { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false },
            { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className={`rounded-lg p-1.5 transition-colors ${
                btn.active
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <btn.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Cornell Layout */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex min-h-[400px]">
          {/* Cues Column */}
          <div className="w-1/3 border-r border-border">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cues & Keywords
              </span>
            </div>
            <textarea
              value={cues}
              onChange={(e) => handleCuesChange(e.target.value)}
              placeholder="Write questions, keywords, or cues here..."
              className="w-full h-full min-h-[360px] resize-none bg-transparent p-3 text-sm text-foreground focus:outline-none"
            />
          </div>

          {/* Notes Column */}
          <div className="flex-1">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Notes
              </span>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Summary Row */}
        <div className="border-t border-border">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Summary
            </span>
          </div>
          <textarea
            value={summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Summarize the key points from your notes..."
            rows={4}
            className="w-full resize-none bg-transparent p-3 text-sm text-foreground focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
