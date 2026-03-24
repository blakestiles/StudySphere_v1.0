"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, Search, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import UserButton from "@/components/features/auth/UserButton";
import NotificationBell from "@/components/features/reminders/NotificationBell";
import TextShimmer from "@/components/ui/text-shimmer";
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
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
  );
}
