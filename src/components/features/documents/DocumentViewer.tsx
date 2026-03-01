"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AnnotationType {
  _id: string;
  type: "highlight" | "underline" | "note";
  color: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  noteText: string;
}

interface DocumentData {
  _id: string;
  title: string;
  rawText: string;
  fileType: string;
  uploadedAt: string;
}

interface Props {
  document: DocumentData;
  initialAnnotations: AnnotationType[];
}

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fbbf24" },
  { label: "Green", value: "#4ade80" },
  { label: "Blue", value: "#60a5fa" },
  { label: "Pink", value: "#f472b6" },
];

export default function DocumentViewer({ document: doc, initialAnnotations }: Props) {
  const [annotations, setAnnotations] = useState<AnnotationType[]>(initialAnnotations);
  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textRef.current) {
      return;
    }

    const range = selection.getRangeAt(0);
    const textContainer = textRef.current;

    // Calculate offsets relative to the raw text
    // Walk through text nodes to find the absolute offset
    const getAbsoluteOffset = (node: Node, offset: number): number => {
      const walker = window.document.createTreeWalker(
        textContainer,
        NodeFilter.SHOW_TEXT,
        null
      );
      let pos = 0;
      let current = walker.nextNode();
      while (current) {
        if (current === node) {
          return pos + offset;
        }
        pos += current.textContent?.length || 0;
        current = walker.nextNode();
      }
      return pos;
    };

    const startOffset = getAbsoluteOffset(range.startContainer, range.startOffset);
    const endOffset = getAbsoluteOffset(range.endContainer, range.endOffset);

    if (startOffset === endOffset) return;

    const rect = range.getBoundingClientRect();
    const containerRect = textContainer.getBoundingClientRect();

    setToolbar({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
      start: Math.min(startOffset, endOffset),
      end: Math.max(startOffset, endOffset),
      text: selection.toString(),
    });
    setShowNoteInput(false);
    setSelectedAnnotation(null);
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.addEventListener("mouseup", handleTextSelect);
    return () => el.removeEventListener("mouseup", handleTextSelect);
  }, [handleTextSelect]);

  // Close toolbar on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbar && textRef.current && !textRef.current.contains(e.target as Node)) {
        setToolbar(null);
        setShowNoteInput(false);
      }
    };
    window.document.addEventListener("mousedown", handleClick);
    return () => window.document.removeEventListener("mousedown", handleClick);
  }, [toolbar]);

  const createAnnotation = async (
    type: "highlight" | "underline" | "note",
    color: string,
    noteText?: string
  ) => {
    if (!toolbar) return;

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc._id,
          type,
          color,
          startOffset: toolbar.start,
          endOffset: toolbar.end,
          selectedText: toolbar.text,
          noteText: noteText || "",
        }),
      });

      if (!res.ok) throw new Error("Failed to create annotation");

      const annotation = await res.json();
      setAnnotations((prev) =>
        [...prev, annotation].sort((a, b) => a.startOffset - b.startOffset)
      );
      setToolbar(null);
      setShowNoteInput(false);
      window.getSelection()?.removeAllRanges();
      toast.success("Annotation added");
    } catch {
      toast.error("Failed to add annotation");
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      const res = await fetch(`/api/annotations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete annotation");

      setAnnotations((prev) => prev.filter((a) => a._id !== id));
      setSelectedAnnotation(null);
      toast.success("Annotation removed");
    } catch {
      toast.error("Failed to remove annotation");
    }
  };

  // Render text with annotations
  const renderAnnotatedText = () => {
    const text = doc.rawText;
    if (annotations.length === 0) {
      return <span>{text}</span>;
    }

    // Build segments with annotation info
    const segments: { start: number; end: number; annotation?: AnnotationType }[] = [];
    let lastEnd = 0;

    // Sort annotations and build non-overlapping segments
    const sorted = [...annotations].sort((a, b) => a.startOffset - b.startOffset);

    for (const ann of sorted) {
      if (ann.startOffset > lastEnd) {
        segments.push({ start: lastEnd, end: ann.startOffset });
      }
      segments.push({
        start: Math.max(ann.startOffset, lastEnd),
        end: ann.endOffset,
        annotation: ann,
      });
      lastEnd = Math.max(lastEnd, ann.endOffset);
    }

    if (lastEnd < text.length) {
      segments.push({ start: lastEnd, end: text.length });
    }

    return segments.map((seg, i) => {
      const content = text.slice(seg.start, seg.end);
      if (!seg.annotation) {
        return <span key={i}>{content}</span>;
      }

      const ann = seg.annotation;
      const isSelected = selectedAnnotation === ann._id;
      const style: React.CSSProperties = {};

      if (ann.type === "highlight" || ann.type === "note") {
        style.backgroundColor = ann.color + "66"; // add transparency
      } else if (ann.type === "underline") {
        style.textDecoration = "underline";
        style.textDecorationColor = ann.color;
        style.textUnderlineOffset = "3px";
      }

      if (isSelected) {
        style.outline = "2px solid #3b82f6";
        style.borderRadius = "2px";
      }

      return (
        <span
          key={i}
          style={style}
          className="cursor-pointer relative"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAnnotation(isSelected ? null : ann._id);
            setToolbar(null);
          }}
          title={ann.type === "note" ? ann.noteText : undefined}
        >
          {content}
          {ann.type === "note" && (
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full ml-0.5 align-super text-[0px]">
              n
            </span>
          )}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{doc.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{doc.fileType.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={textRef}>
            {/* Floating Toolbar */}
            {toolbar && (
              <div
                className="absolute z-50 bg-card border rounded-lg shadow-lg p-2 flex flex-col gap-2"
                style={{
                  left: `${toolbar.x}px`,
                  top: `${toolbar.y}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="flex gap-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value }}
                      title={`Highlight ${c.label}`}
                      onClick={() => createAnnotation("highlight", c.value)}
                    />
                  ))}
                  <button
                    className="px-2 text-xs border rounded hover:bg-accent"
                    onClick={() => createAnnotation("underline", "#3b82f6")}
                  >
                    U
                  </button>
                  <button
                    className="px-2 text-xs border rounded hover:bg-accent"
                    onClick={() => setShowNoteInput(true)}
                  >
                    Note
                  </button>
                </div>
                {showNoteInput && (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && noteInput.trim()) {
                          createAnnotation("note", "#fbbf24", noteInput.trim());
                          setNoteInput("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (noteInput.trim()) {
                          createAnnotation("note", "#fbbf24", noteInput.trim());
                          setNoteInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Document Text */}
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-muted/30 rounded-lg max-h-[70vh] overflow-y-auto">
              {renderAnnotatedText()}
            </div>
          </div>

          {/* Selected annotation actions */}
          {selectedAnnotation && (
            <div className="mt-3 flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">
                {annotations.find((a) => a._id === selectedAnnotation)?.type === "note"
                  ? `Note: "${annotations.find((a) => a._id === selectedAnnotation)?.noteText}"`
                  : "Selected annotation"}
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteAnnotation(selectedAnnotation)}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedAnnotation(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
