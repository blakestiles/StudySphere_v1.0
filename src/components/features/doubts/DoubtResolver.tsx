"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StudyPackOption {
  _id: string;
  title: string;
}

interface Doubt {
  _id: string;
  inputText: string;
  explanation: string;
  createdAt: string;
}

interface DoubtResolverProps {
  studyPacks: StudyPackOption[];
}

/* -- Icons -- */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export default function DoubtResolver({ studyPacks }: DoubtResolverProps) {
  const [inputText, setInputText] = useState("");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [history, setHistory] = useState<Doubt[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/doubts");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.doubts);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleResolve() {
    if (inputText.trim().length < 10) {
      toast.error("Please provide at least 10 characters");
      return;
    }

    setIsResolving(true);
    setCurrentExplanation(null);

    try {
      const res = await fetch("/api/doubts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: inputText.trim(),
          studyPackId: selectedPackId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve doubt");
      }

      const data = await res.json();
      setCurrentExplanation(data.doubt.explanation);
      setHistory((prev) => [data.doubt, ...prev]);
      toast.success("Doubt resolved!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resolve doubt"
      );
    } finally {
      setIsResolving(false);
    }
  }

  function handleClear() {
    setInputText("");
    setCurrentExplanation(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Area */}
      <div className="lg:col-span-2 space-y-4">
        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste the confusing text, concept, or question here..."
            rows={6}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">No study pack context</option>
                {studyPacks.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.title}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <button
              onClick={handleResolve}
              disabled={inputText.trim().length < 10 || isResolving}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isResolving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resolving...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Resolve
                </>
              )}
            </button>
            {currentExplanation && (
              <button
                onClick={handleClear}
                className="px-3 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {isResolving && (
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              AI is breaking down your doubt step-by-step...
            </p>
          </div>
        )}

        {/* Explanation Result */}
        {currentExplanation && !isResolving && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Explanation</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentExplanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* History Panel */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Past Doubts</h3>
        {isLoadingHistory ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">
            No past doubts yet. Resolve your first doubt!
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {history.map((d) => (
              <div
                key={d._id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === d._id ? null : d._id)
                  }
                  className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-muted/50 transition"
                >
                  <ChevronRightIcon
                    className={`h-4 w-4 mt-0.5 shrink-0 text-muted-foreground transition-transform ${
                      expandedId === d._id ? "rotate-90" : ""
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-2">
                      {d.inputText}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                {expandedId === d._id && (
                  <div className="px-3 pb-3 border-t border-border">
                    <div className="prose prose-xs dark:prose-invert max-w-none text-foreground mt-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {d.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
