"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import {
  BookOpen, Network, List, Layers, ClipboardList,
  PenLine, Shuffle, Share2, Download, Copy, Check,
  X, ChevronLeft, ChevronDown, FileText, ArrowLeft,
} from "lucide-react";

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-40 rounded-xl bg-muted/40" />
      <div className="h-24 rounded-xl bg-muted/30" />
    </div>
  );
}

const FlashcardViewer = dynamic(() => import("./FlashcardViewer"), { loading: () => <TabSkeleton /> });
const QuizInterface = dynamic(() => import("@/components/features/quiz/QuizInterface"), { loading: () => <TabSkeleton /> });
const MindMapView = dynamic(() => import("@/components/features/mind-map/MindMapView"), { loading: () => <TabSkeleton /> });
const ClozeTab = dynamic(() => import("@/components/features/cloze/ClozeTab"), { loading: () => <TabSkeleton /> });
const MatchingTab = dynamic(() => import("@/components/features/matching/MatchingTab"), { loading: () => <TabSkeleton /> });

interface MindMapNode { id: string; label: string; children?: MindMapNode[] }

interface SerializedStudyPack {
  _id: string;
  title: string;
  summaries: { short: string; detailed: string };
  status: "generating" | "ready" | "error";
  createdAt: string;
  mindMap?: MindMapNode | null;
  shareToken?: string | null;
  isPublic?: boolean;
}

interface SerializedTopic {
  _id: string; name: string; content: string; order: number; parentTopicId?: string;
}

interface SerializedFlashcard {
  _id: string; question: string; answer: string;
  difficulty: "easy" | "medium" | "hard"; topicId?: string;
  easeFactor?: number; intervalDays?: number; repetitions?: number;
  nextReviewAt?: string; lastSeenAt?: string;
}

interface SerializedQuizQuestion {
  _id: string; question: string; options: string[];
  correctAnswer: number; explanation: string; topicId?: string;
}

interface SerializedClozeQuestion {
  _id: string; originalText: string; blankedText: string;
  answers: string[]; blankCount: number;
}

interface StudyPackDetailProps {
  studyPack: SerializedStudyPack;
  topics: SerializedTopic[];
  flashcards: SerializedFlashcard[];
  quizQuestions: SerializedQuizQuestion[];
  clozeQuestions: SerializedClozeQuestion[];
}

const DEPTH_COLORS = [
  { dot: "bg-orange-500", bg: "bg-orange-500/8", border: "border-orange-500/15", text: "text-orange-500" },
  { dot: "bg-blue-500",   bg: "bg-blue-500/8",   border: "border-blue-500/15",   text: "text-blue-500"   },
  { dot: "bg-emerald-500",bg: "bg-emerald-500/8", border: "border-emerald-500/15",text: "text-emerald-500"},
  { dot: "bg-violet-500", bg: "bg-violet-500/8",  border: "border-violet-500/15", text: "text-violet-500" },
  { dot: "bg-rose-500",   bg: "bg-rose-500/8",    border: "border-rose-500/15",   text: "text-rose-500"   },
  { dot: "bg-cyan-500",   bg: "bg-cyan-500/8",    border: "border-cyan-500/15",   text: "text-cyan-500"   },
  { dot: "bg-amber-500",  bg: "bg-amber-500/8",   border: "border-amber-500/15",  text: "text-amber-500"  },
];

function TopicItem({ topic, index }: { topic: SerializedTopic; index: number }) {
  const [open, setOpen] = useState(false);
  const color = DEPTH_COLORS[index % DEPTH_COLORS.length];

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${open ? color.border : "border-border/50 hover:border-border"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
        <span className={`text-[11px] font-bold tabular-nums w-5 shrink-0 ${color.text} opacity-60`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-[13.5px] font-medium text-foreground">{topic.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && topic.content && (
        <div className={`border-t ${color.border} px-4 py-3.5 pl-[52px] ${color.bg}`}>
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{topic.content}</p>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: number; label: string;
  color: "amber" | "blue" | "emerald" | "violet" | "rose";
}) {
  const colors = {
    amber:   "bg-amber-500/8 border-amber-500/15 text-amber-600 dark:text-amber-400",
    blue:    "bg-blue-500/8 border-blue-500/15 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/8 border-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    violet:  "bg-violet-500/8 border-violet-500/15 text-violet-600 dark:text-violet-400",
    rose:    "bg-rose-500/8 border-rose-500/15 text-rose-600 dark:text-rose-400",
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${colors[color]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="tabular-nums">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, hint }: { icon: React.ElementType; message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/50">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-muted/30 blur-xl" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
          <Icon className="h-6 w-6 text-muted-foreground/40" />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{message}</p>
      {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

export default function StudyPackDetail({
  studyPack, topics, flashcards, quizQuestions, clozeQuestions,
}: StudyPackDetailProps) {
  const sortedTopics = [...topics].sort((a, b) => a.order - b.order);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(studyPack.shareToken ?? null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreateShare() {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/study-packs/${studyPack._id}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setShareToken(data.shareToken);
    } finally { setIsSharing(false); }
  }

  async function handleDisableShare() {
    setIsSharing(true);
    try {
      await fetch(`/api/study-packs/${studyPack._id}/share`, { method: "DELETE" });
      setShareToken(null);
    } finally { setIsSharing(false); }
  }

  function handleCopy() {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/study-packs/share/${shareToken}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport(format: "csv" | "text") {
    setExportOpen(false);
    window.open(`/api/study-packs/${studyPack._id}/export?format=${format}`, "_blank");
  }

  // ── Generating ──────────────────────────────────────────

  if (studyPack.status === "generating") {
    return (
      <div className="space-y-5">
        <Link href="/study-packs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Study Packs
        </Link>
        <div className="rounded-2xl border border-amber-500/20 bg-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">{studyPack.title}</h2>
          <p className="text-sm text-muted-foreground mb-1">Building your study pack…</p>
          <p className="text-xs text-muted-foreground/60">AI is generating summaries, topics, flashcards & quiz questions. Refresh to check progress.</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────

  if (studyPack.status === "error") {
    return (
      <div className="space-y-5">
        <Link href="/study-packs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Study Packs
        </Link>
        <div className="rounded-2xl border border-destructive/20 bg-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/8 border border-destructive/15 flex items-center justify-center mb-4">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">{studyPack.title}</h2>
          <p className="text-sm text-muted-foreground">There was an error generating this pack. Try re-uploading the document.</p>
        </div>
      </div>
    );
  }

  // ── Ready ───────────────────────────────────────────────

  const createdDate = new Date(studyPack.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="space-y-5">

      {/* ── Hero Header ──────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Amber top accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-amber-500/80 via-amber-500/40 to-transparent" />

        <div className="p-5 sm:p-6">
          {/* Nav + actions row */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <Link href="/study-packs" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
              <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Study Packs
            </Link>
            <div className="flex items-center gap-2">
              {/* Export */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setExportOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                {exportOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[148px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    <button onClick={() => handleExport("csv")} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                      Export as CSV
                    </button>
                    <button onClick={() => handleExport("text")} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                      Export as Text
                    </button>
                  </div>
                )}
              </div>
              {/* Share */}
              <button
                onClick={() => setShareDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_oklch(0.76_0.17_62_/_30%)] hover:shadow-[0_4px_14px_oklch(0.76_0.17_62_/_40%)] transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1 leading-snug">
            {studyPack.title}
          </h1>
          <p className="text-xs text-muted-foreground/50 mb-5">Created {createdDate}</p>

          {/* Content stat chips */}
          <div className="flex flex-wrap gap-2">
            {topics.length > 0 && <StatChip icon={List} value={topics.length} label="Topics" color="blue" />}
            {flashcards.length > 0 && <StatChip icon={Layers} value={flashcards.length} label="Flashcards" color="amber" />}
            {quizQuestions.length > 0 && <StatChip icon={ClipboardList} value={quizQuestions.length} label="Quiz Qs" color="emerald" />}
            {clozeQuestions.length > 0 && <StatChip icon={PenLine} value={clozeQuestions.length} label="Fill-in" color="violet" />}
          </div>
        </div>
      </div>

      {/* ── Share Dialog ─────────────────────────────── */}
      {shareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Share Study Pack</h2>
              <button onClick={() => setShareDialogOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {!shareToken ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Create a shareable link so anyone can view this study pack.</p>
                <button
                  onClick={handleCreateShare}
                  disabled={isSharing}
                  className="w-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                >
                  {isSharing ? "Creating…" : "Create share link"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Anyone with this link can view the study pack.</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/study-packs/share/${shareToken}`}
                    className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={handleDisableShare}
                  disabled={isSharing}
                  className="w-full rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 disabled:opacity-60 transition-colors"
                >
                  {isSharing ? "Disabling…" : "Disable sharing"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────── */}
      <AnimatedTabs
        tabs={[
          {
            id: "summary",
            label: "Summary",
            icon: BookOpen,
            content: (
              <div className="space-y-3">
                {studyPack.summaries.short && (
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-muted/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">Overview</span>
                    </div>
                    <p className="px-5 py-4 text-[14px] text-muted-foreground leading-relaxed">
                      {studyPack.summaries.short}
                    </p>
                  </div>
                )}
                {studyPack.summaries.detailed && (
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-muted/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">Detailed Summary</span>
                    </div>
                    <p className="px-5 py-4 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {studyPack.summaries.detailed}
                    </p>
                  </div>
                )}
                {!studyPack.summaries.short && !studyPack.summaries.detailed && (
                  <EmptyState icon={FileText} message="No summary available" />
                )}
              </div>
            ),
          },
          {
            id: "mindmap",
            label: "Mind Map",
            icon: Network,
            content: studyPack.mindMap
              ? <MindMapView mindMap={studyPack.mindMap} title={studyPack.title} />
              : <EmptyState icon={Network} message="No mind map available" hint="Regenerate the study pack to create one" />,
          },
          {
            id: "topics",
            label: "Topics",
            icon: List,
            badge: topics.length,
            content: sortedTopics.length === 0
              ? <EmptyState icon={List} message="No topics available" />
              : (
                <div className="space-y-2">
                  {sortedTopics.map((topic, i) => <TopicItem key={topic._id} topic={topic} index={i} />)}
                </div>
              ),
          },
          {
            id: "flashcards",
            label: "Flashcards",
            icon: Layers,
            badge: flashcards.length,
            content: <FlashcardViewer flashcards={flashcards} />,
          },
          {
            id: "quiz",
            label: "Quiz",
            icon: ClipboardList,
            badge: quizQuestions.length,
            content: quizQuestions.length === 0
              ? <EmptyState icon={ClipboardList} message="No quiz questions available" />
              : <QuizInterface questions={quizQuestions} studyPackId={studyPack._id} />,
          },
          {
            id: "fillinblank",
            label: "Fill in Blank",
            icon: PenLine,
            badge: clozeQuestions.length,
            content: clozeQuestions.length === 0
              ? <EmptyState icon={PenLine} message="No fill-in-blank questions" hint="Regenerate the study pack to create them" />
              : <ClozeTab questions={clozeQuestions} />,
          },
          {
            id: "matching",
            label: "Matching",
            icon: Shuffle,
            content: flashcards.length < 2
              ? <EmptyState icon={Shuffle} message="Not enough flashcards" hint="At least 2 flashcards are needed" />
              : <MatchingTab flashcards={flashcards} />,
          },
        ]}
      />
    </div>
  );
}
