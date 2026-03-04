"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, Search, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import UserButton from "@/components/features/auth/UserButton";
import NotificationBell from "@/components/features/reminders/NotificationBell";

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
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled
        ? "bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-sm shadow-black/[0.03] dark:shadow-black/10"
        : "bg-background/60 backdrop-blur-lg border-b border-transparent"
    }`}>
      <div className="flex h-14 items-center px-4 md:px-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMobileSidebar}
          className="mr-3 rounded-xl p-2 text-muted-foreground hover:text-foreground md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </motion.button>

        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl group">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-shadow"
          >
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </motion.div>
          <span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Study</span>
            <span>Sphere</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCommandPalette}
            className="hidden items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/60 sm:flex transition-all duration-200"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-muted-foreground/70">Search...</span>
            <kbd className="pointer-events-none ml-2 inline-flex h-5 items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </motion.button>

          <AnimatePresence mode="wait">
            {mounted && (
              <motion.button
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="absolute inset-0 rounded-xl" />
              </motion.button>
            )}
          </AnimatePresence>

          <NotificationBell />

          <UserButton />
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-300 ${
        scrolled ? "opacity-100" : "opacity-0"
      } bg-gradient-to-r from-transparent via-orange-500/15 to-transparent`} />
    </nav>
  );
}
