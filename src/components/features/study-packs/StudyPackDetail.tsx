"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

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

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

interface SerializedStudyPack {
  _id: string;
  title: string;
  summaries: {
    short: string;
    detailed: string;
  };
  status: "generating" | "ready" | "error";
  createdAt: string;
  mindMap?: MindMapNode | null;
}

interface SerializedTopic {
  _id: string;
  name: string;
  content: string;
  order: number;
  parentTopicId?: string;
}

interface SerializedFlashcard {
  _id: string;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  topicId?: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  nextReviewAt?: string;
  lastSeenAt?: string;
}

interface SerializedQuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topicId?: string;
}

interface SerializedClozeQuestion {
  _id: string;
  originalText: string;
  blankedText: string;
  answers: string[];
  blankCount: number;
}

interface StudyPackDetailProps {
  studyPack: SerializedStudyPack;
  topics: SerializedTopic[];
  flashcards: SerializedFlashcard[];
  quizQuestions: SerializedQuizQuestion[];
  clozeQuestions: SerializedClozeQuestion[];
}

// ── Depth colors (matching MindMapView) ────────────────

const DEPTH_COLORS = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
];

function getDepthColor(index: number) {
  return DEPTH_COLORS[index % DEPTH_COLORS.length];
}

// ── Tab definitions ────────────────────────────────────

type TabKey = "summary" | "mindmap" | "topics" | "flashcards" | "quiz" | "fillinblank" | "matching";

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

// ── SVG Icons ──────────────────────────────────────────

function ClipboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path strokeLinecap="round" d="M12 8v3M8.5 16.5L10.5 13M15.5 16.5L13.5 13" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="6" width="16" height="14" rx="2" />
      <path strokeLinecap="round" d="M6 2h12a2 2 0 012 2v2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  );
}

function TextCursorIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h1a3 3 0 013 3 3 3 0 013-3h1M5 20h1a3 3 0 003-3 3 3 0 003 3h1M12 4v16M8 4h8M8 20h8" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
  );
}

// ── Collapsible Topic Item ─────────────────────────────

function TopicItem({ topic, index }: { topic: SerializedTopic; index: number }) {
  const [open, setOpen] = useState(false);
  const depthColor = getDepthColor(index);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        {/* Depth indicator dot */}
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${depthColor}`} />

        {/* Number */}
        <span className="text-xs font-semibold text-muted-foreground tabular-nums w-6">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Topic name */}
        <span className="flex-1 text-sm font-medium text-foreground">
          {topic.name}
        </span>

        {/* Chevron */}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && topic.content && (
        <div className="border-t border-border px-5 py-4 pl-16">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {topic.content}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function StudyPackDetail({
  studyPack,
  topics,
  flashcards,
  quizQuestions,
  clozeQuestions,
}: StudyPackDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const sortedTopics = [...topics].sort((a, b) => a.order - b.order);

  const tabs: TabDef[] = [
    { key: "summary", label: "Summary", icon: <ClipboardIcon /> },
    { key: "mindmap", label: "Mind Map", icon: <NetworkIcon /> },
    { key: "topics", label: "Topics", icon: <LayersIcon />, count: topics.length },
    { key: "flashcards", label: "Flashcards", icon: <CardsIcon />, count: flashcards.length },
    { key: "quiz", label: "Quiz", icon: <CheckCircleIcon />, count: quizQuestions.length },
    { key: "fillinblank", label: "Fill in Blank", icon: <TextCursorIcon />, count: clozeQuestions.length },
    { key: "matching", label: "Matching", icon: <PuzzleIcon />, count: flashcards.length },
  ];

  // ── Generating state ───────────────────────────────

  if (studyPack.status === "generating") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{studyPack.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 border border-amber-500/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Generating
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <LoaderIcon />
          <p className="mt-5 text-foreground font-medium">
            Building your study pack...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            AI is analyzing your document and generating summaries, topics, flashcards, and quiz questions. This may take a minute.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Refresh the page to check progress.
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────

  if (studyPack.status === "error") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{studyPack.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500 border border-red-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Error
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="mt-4 text-foreground font-medium">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            There was an error generating this study pack. Please try again by uploading the document.
          </p>
        </div>
      </div>
    );
  }

  // ── Ready state ────────────────────────────────────

  const statParts = [];
  if (topics.length > 0) statParts.push(`${topics.length} Topic${topics.length !== 1 ? "s" : ""}`);
  if (flashcards.length > 0) statParts.push(`${flashcards.length} Flashcard${flashcards.length !== 1 ? "s" : ""}`);
  if (quizQuestions.length > 0) statParts.push(`${quizQuestions.length} Quiz Question${quizQuestions.length !== 1 ? "s" : ""}`);
  if (clozeQuestions.length > 0) statParts.push(`${clozeQuestions.length} Fill-in-Blank`);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{studyPack.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Ready
          </span>
          <span className="text-sm text-muted-foreground">
            Created {new Date(studyPack.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          {statParts.length > 0 && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-sm text-muted-foreground">
                {statParts.join(" \u00B7 ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/50 p-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────── */}
      <div>
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {studyPack.summaries.short && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                    <span className="text-orange-500">
                      <FileTextIcon />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-2">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {studyPack.summaries.short}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {studyPack.summaries.detailed && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <span className="text-blue-500">
                      <BookOpenIcon />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-2">Detailed Summary</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {studyPack.summaries.detailed}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!studyPack.summaries.short && !studyPack.summaries.detailed && (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ClipboardIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No summaries available yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mind Map Tab */}
        {activeTab === "mindmap" && (
          <>
            {studyPack.mindMap ? (
              <MindMapView mindMap={studyPack.mindMap} title={studyPack.title} />
            ) : (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <NetworkIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No mind map available. Regenerate the study pack to create one.
                </p>
              </div>
            )}
          </>
        )}

        {/* Topics Tab */}
        {activeTab === "topics" && (
          <>
            {sortedTopics.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <LayersIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No topics available yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTopics.map((topic, index) => (
                  <TopicItem key={topic._id} topic={topic} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Flashcards Tab */}
        {activeTab === "flashcards" && (
          <FlashcardViewer flashcards={flashcards} />
        )}

        {/* Quiz Tab */}
        {activeTab === "quiz" && (
          <>
            {quizQuestions.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CheckCircleIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No quiz questions available yet.
                </p>
              </div>
            ) : (
              <QuizInterface
                questions={quizQuestions}
                studyPackId={studyPack._id}
              />
            )}
          </>
        )}

        {/* Fill-in-Blank Tab */}
        {activeTab === "fillinblank" && (
          <>
            {clozeQuestions.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <TextCursorIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No fill-in-the-blank questions available yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Regenerate the study pack to create them.
                </p>
              </div>
            ) : (
              <ClozeTab questions={clozeQuestions} />
            )}
          </>
        )}

        {/* Matching Tab */}
        {activeTab === "matching" && (
          <>
            {flashcards.length < 2 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <PuzzleIcon />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Not enough flashcards for the matching game.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  At least 2 flashcards are needed.
                </p>
              </div>
            ) : (
              <MatchingTab flashcards={flashcards} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
