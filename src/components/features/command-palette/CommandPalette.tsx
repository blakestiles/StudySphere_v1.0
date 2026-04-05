"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Upload, FileText, BookOpen, Target,
  CalendarDays, BarChart3, PenLine, Bot, CalendarCheck2,
  Network, ClipboardCheck, NotebookPen, Trophy, Headphones,
  TrendingUp, History, User, Search, ArrowRight, Clock,
  Zap, Flame, ScrollText, Calculator, Store,
} from "lucide-react";

// ── Page registry ──────────────────────────────────────────────────────────────

type Page = {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  group: "core" | "study" | "ai" | "reports";
  keywords?: string;
};

const GROUP_META: Record<Page["group"], { label: string; color: string }> = {
  core:    { label: "Navigation",          color: "text-blue-500" },
  study:   { label: "Study Tools",         color: "text-amber-500" },
  ai:      { label: "AI Features",         color: "text-violet-500" },
  reports: { label: "Analytics & Reports", color: "text-emerald-500" },
};

const PAGES: Page[] = [
  // core
  { name: "Dashboard",      href: "/dashboard",       icon: <LayoutDashboard className="h-4 w-4" />, description: "Overview and quick actions",           group: "core" },
  { name: "Documents",      href: "/documents",       icon: <FileText        className="h-4 w-4" />, description: "Uploaded PDFs and text files",         group: "core" },
  { name: "Study Packs",    href: "/study-packs",     icon: <BookOpen        className="h-4 w-4" />, description: "AI-generated summaries and flashcards", group: "core" },
  { name: "Profile",        href: "/profile",         icon: <User            className="h-4 w-4" />, description: "Account settings and achievements",    group: "core" },

  // study
  { name: "Upload",           href: "/upload",          icon: <Upload          className="h-4 w-4" />, description: "Upload a PDF or paste text",                  group: "study" },
  { name: "Focus Mode",       href: "/focus",           icon: <Target          className="h-4 w-4" />, description: "Pomodoro timer with goal tracking",           group: "study" },
  { name: "Exam Simulator",   href: "/exam-simulator",  icon: <ClipboardCheck  className="h-4 w-4" />, description: "Proctored AI-generated exams",                group: "study" },
  { name: "Audio Study",      href: "/audio-study",     icon: <Headphones      className="h-4 w-4" />, description: "Listen to your study material",               group: "study" },
  { name: "Notebooks",        href: "/notebooks",       icon: <NotebookPen     className="h-4 w-4" />, description: "Cornell-style notes with rich text",          group: "study" },
  { name: "Practice Essay",   href: "/practice-essay",  icon: <PenLine         className="h-4 w-4" />, description: "Write essays with AI grading",                group: "study" },
  { name: "Goals",            href: "/goals",           icon: <Trophy          className="h-4 w-4" />, description: "Set targets and track milestones",            group: "study" },
  { name: "Cheat Sheets",     href: "/cheat-sheets",    icon: <ScrollText      className="h-4 w-4" />, description: "Generate condensed exam cheat sheets",        group: "study", keywords: "cheat sheet exam notes summary" },
  { name: "Grade Calculator", href: "/grade-calculator",icon: <Calculator      className="h-4 w-4" />, description: "What-if calculator for your target grade",    group: "study", keywords: "grade gpa score final calculator what if" },

  // ai
  { name: "AI Tutor",         href: "/chat",            icon: <Bot             className="h-4 w-4" />, description: "Ask anything about your material",            group: "ai" },
  { name: "Study Plan",       href: "/study-plan",      icon: <CalendarCheck2  className="h-4 w-4" />, description: "AI-generated personalised schedule",          group: "ai" },
  { name: "Knowledge Graph",  href: "/knowledge-graph", icon: <Network         className="h-4 w-4" />, description: "Topic connections across all packs",          group: "ai" },

  // reports
  { name: "Analytics",        href: "/analytics",       icon: <BarChart3       className="h-4 w-4" />, description: "Study streaks, scores, and trends",           group: "reports" },
  { name: "Calendar",         href: "/calendar",        icon: <CalendarDays    className="h-4 w-4" />, description: "Study events and schedule",                   group: "reports" },
  { name: "History",          href: "/history",         icon: <History         className="h-4 w-4" />, description: "Past quizzes, essays, and sessions",          group: "reports" },
  { name: "Weekly Report",    href: "/weekly-report",   icon: <TrendingUp      className="h-4 w-4" />, description: "AI performance analysis for the week",        group: "reports" },
  { name: "Study Exchange",   href: "/marketplace",     icon: <Store           className="h-4 w-4" />, description: "Share and discover study packs",              group: "reports", keywords: "marketplace share packs community" },
];

const QUICK_ACTIONS = [
  { name: "Upload document",    href: "/upload",          icon: <Upload       className="h-3.5 w-3.5" />, label: "Upload" },
  { name: "Start focus session",href: "/focus",           icon: <Flame        className="h-3.5 w-3.5" />, label: "Focus" },
  { name: "Generate study plan",href: "/study-plan",      icon: <Zap          className="h-3.5 w-3.5" />, label: "Plan" },
  { name: "Cheat sheets",       href: "/cheat-sheets",    icon: <ScrollText   className="h-3.5 w-3.5" />, label: "Cheat Sheet" },
  { name: "Grade calculator",   href: "/grade-calculator",icon: <Calculator   className="h-3.5 w-3.5" />, label: "Grades" },
];

const RECENT_KEY = "ss:recent-pages";
const MAX_RECENT = 4;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

function pushRecent(href: string) {
  if (typeof window === "undefined") return;
  try {
    const prev = getRecent().filter((h) => h !== href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...prev].slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

// ── Icon color by group ────────────────────────────────────────────────────────

const GROUP_ICON_CLASSES: Record<Page["group"], string> = {
  core:    "bg-blue-500/10 border-blue-500/20 text-blue-500",
  study:   "bg-amber-500/10 border-amber-500/20 text-amber-500",
  ai:      "bg-violet-500/10 border-violet-500/20 text-violet-500",
  reports: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent on open
  useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  // Push current page to recent on navigation
  useEffect(() => {
    if (pathname) pushRecent(pathname);
  }, [pathname]);

  const handleOpen = useCallback(() => {
    setQuery("");
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) setQuery("");
          return !prev;
        });
      }
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", handleOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", handleOpen);
    };
  }, [handleOpen, handleClose]);

  const navigateTo = (href: string) => {
    pushRecent(href);
    handleClose();
    router.push(href);
  };

  // Build display groups
  const recentPages = recent
    .map((href) => PAGES.find((p) => p.href === href))
    .filter(Boolean) as Page[];

  const hasQuery = query.trim().length > 0;

  const groups = (["core", "study", "ai", "reports"] as Page["group"][]).map((g) => ({
    ...GROUP_META[g],
    key: g,
    pages: PAGES.filter((p) => p.group === g),
  }));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl pointer-events-auto"
            >
              <Command
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                label="Command palette"
                shouldFilter={hasQuery}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-border/60 px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <Command.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search pages, tools, features…"
                    className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    autoFocus
                  />
                  <kbd className="hidden sm:flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[420px] overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]">
                  <Command.Empty className="flex flex-col items-center gap-2 py-10 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                  </Command.Empty>

                  {/* Recent pages — shown only when no query */}
                  {!hasQuery && recentPages.length > 0 && (
                    <Command.Group>
                      <div className="flex items-center gap-1.5 px-2 pb-1 pt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">Recent</span>
                      </div>
                      {recentPages.map((page) => (
                        <PageItem key={`recent-${page.href}`} page={page} onSelect={() => navigateTo(page.href)} />
                      ))}
                    </Command.Group>
                  )}

                  {/* Grouped pages */}
                  {groups.map((group) => (
                    <Command.Group key={group.key}>
                      <div className={`flex items-center gap-1.5 px-2 pb-1 pt-3 first:pt-1.5`}>
                        <span className={`text-[11px] font-semibold uppercase tracking-widest ${group.color} opacity-70`}>
                          {group.label}
                        </span>
                      </div>
                      {group.pages.map((page) => (
                        <PageItem key={page.href} page={page} onSelect={() => navigateTo(page.href)} />
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.href}
                        onClick={() => navigateTo(a.href)}
                        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {a.icon}
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Page item ──────────────────────────────────────────────────────────────────

function PageItem({ page, onSelect }: { page: Page; onSelect: () => void }) {
  return (
    <Command.Item
      value={`${page.name} ${page.description} ${page.keywords ?? ""}`}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors aria-selected:bg-muted/60 aria-selected:text-foreground"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${GROUP_ICON_CLASSES[page.group]} group-data-[selected=true]:opacity-100`}>
        {page.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground leading-tight">{page.name}</p>
        <p className="text-[11px] text-muted-foreground/60 leading-tight truncate">{page.description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-all group-data-[selected=true]:text-amber-500/70" />
    </Command.Item>
  );
}
