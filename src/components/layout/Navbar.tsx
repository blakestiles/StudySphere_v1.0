"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, Search, GraduationCap, Loader2, FileText, BookOpen, Tag, Layers } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import UserButton from "@/components/features/auth/UserButton";
import NotificationBell from "@/components/features/reminders/NotificationBell";
import TextShimmer from "@/components/ui/text-shimmer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResult {
  _id: string;
  type: "document" | "studypack" | "topic" | "flashcard";
  title?: string;
  name?: string;
  question?: string;
  studyPackId?: string;
}

interface SearchResults {
  documents: SearchResult[];
  studyPacks: SearchResult[];
  topics: SearchResult[];
  flashcards: SearchResult[];
}

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = useCallback(
    (result: SearchResult) => {
      if (result.type === "document") {
        router.push(`/documents/${result._id}`);
      } else if (result.type === "studypack") {
        router.push(`/study-packs/${result._id}`);
      } else {
        router.push(`/study-packs/${result.studyPackId}`);
      }
      setSearchOpen(false);
      setQuery("");
      setResults(null);
    },
    [router]
  );

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const hasResults =
    results &&
    (results.documents.length > 0 ||
      results.studyPacks.length > 0 ||
      results.topics.length > 0 ||
      results.flashcards.length > 0);

  return (
    <>
      <nav className={`relative overflow-hidden sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-2xl border-b border-border/60 shadow-sm"
          : "bg-background/50 backdrop-blur-lg border-b border-transparent"
      }`}>
        <div className="flex h-14 items-center px-4 md:px-6 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMobileSidebar}
            className="rounded-xl p-2 text-muted-foreground hover:text-foreground md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow"
            >
              <GraduationCap className="w-4 h-4 text-white" />
            </motion.div>
            <TextShimmer className="font-display font-bold text-lg tracking-tight" duration={3}>
              StudySphere
            </TextShimmer>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={openCommandPalette}
              className="hidden items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 sm:flex transition-all duration-200"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground/60 text-[13px]">Search anything…</span>
              <kbd className="pointer-events-none ml-1.5 inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-background/70 px-1.5 font-mono text-[10px] text-muted-foreground/60">
                ⌘K
              </kbd>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(true)}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </motion.button>

            <AnimatePresence mode="wait">
              {mounted && (
                <motion.button
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4.5 w-4.5" />
                  ) : (
                    <Moon className="h-4.5 w-4.5" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <NotificationBell />
            <UserButton />
          </div>
        </div>

        {/* Gradient accent line */}
        <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        } bg-gradient-to-r from-transparent via-amber-500/20 to-transparent`} />
      </nav>

      <Dialog open={searchOpen} onOpenChange={(open) => {
        setSearchOpen(open);
        if (!open) {
          setQuery("");
          setResults(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            {searching ? (
              <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <input
              autoFocus
              type="text"
              placeholder="Search documents, study packs, topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          {query.length >= 2 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {!searching && !hasResults && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </p>
              )}

              {results?.documents && results.documents.length > 0 && (
                <ResultGroup
                  label="Documents"
                  icon={<FileText className="h-3.5 w-3.5" />}
                  items={results.documents.map((d) => ({
                    id: d._id,
                    label: d.title ?? "",
                    result: d,
                  }))}
                  onSelect={handleNavigate}
                />
              )}

              {results?.studyPacks && results.studyPacks.length > 0 && (
                <ResultGroup
                  label="Study Packs"
                  icon={<BookOpen className="h-3.5 w-3.5" />}
                  items={results.studyPacks.map((s) => ({
                    id: s._id,
                    label: s.title ?? "",
                    result: s,
                  }))}
                  onSelect={handleNavigate}
                />
              )}

              {results?.topics && results.topics.length > 0 && (
                <ResultGroup
                  label="Topics"
                  icon={<Tag className="h-3.5 w-3.5" />}
                  items={results.topics.map((t) => ({
                    id: t._id,
                    label: t.name ?? "",
                    result: t,
                  }))}
                  onSelect={handleNavigate}
                />
              )}

              {results?.flashcards && results.flashcards.length > 0 && (
                <ResultGroup
                  label="Flashcards"
                  icon={<Layers className="h-3.5 w-3.5" />}
                  items={results.flashcards.map((f) => ({
                    id: f._id,
                    label: f.question ?? "",
                    result: f,
                  }))}
                  onSelect={handleNavigate}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultGroup({
  label,
  icon,
  items,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  items: { id: string; label: string; result: SearchResult }[];
  onSelect: (result: SearchResult) => void;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {items.map(({ id, label, result }) => (
        <button
          key={id}
          onClick={() => onSelect(result)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 transition-colors truncate"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
