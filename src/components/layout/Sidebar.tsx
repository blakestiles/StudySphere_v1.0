"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Upload,
  FileText,
  BookOpen,
  Target,
  CalendarDays,
  BarChart3,
  PenTool,
  MessageSquare,
  CalendarRange,
  Brain,
  History,
  User,
  ClipboardCheck,
  NotebookPen,
  Trophy,
  Headphones,
  FileBarChart,
  Store,
  ScrollText,
  Calculator,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "amber" },
      { label: "Upload", href: "/upload", icon: Upload, color: "amber" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Documents", href: "/documents", icon: FileText, color: "blue" },
      { label: "Study Packs", href: "/study-packs", icon: BookOpen, color: "blue" },
      { label: "AI Tutor", href: "/chat", icon: MessageSquare, color: "blue" },
      { label: "Audio Study", href: "/audio-study", icon: Headphones, color: "blue" },
      { label: "Cheat Sheets", href: "/cheat-sheets", icon: ScrollText, color: "blue" },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Focus Mode", href: "/focus", icon: Target, color: "rose" },
      { label: "Exam Simulator", href: "/exam-simulator", icon: ClipboardCheck, color: "rose" },
      { label: "Practice Essay", href: "/practice-essay", icon: PenTool, color: "rose" },
    ],
  },
  {
    label: "Track",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, color: "violet" },
      { label: "Calendar", href: "/calendar", icon: CalendarDays, color: "violet" },
      { label: "Study Plan", href: "/study-plan", icon: CalendarRange, color: "violet" },
      { label: "Weekly Report", href: "/weekly-report", icon: FileBarChart, color: "violet" },
      { label: "History", href: "/history", icon: History, color: "violet" },
      { label: "Grade Calculator", href: "/grade-calculator", icon: Calculator, color: "amber" },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Notebooks", href: "/notebooks", icon: NotebookPen, color: "emerald" },
      { label: "Goals", href: "/goals", icon: Trophy, color: "emerald" },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Knowledge Graph", href: "/knowledge-graph", icon: Brain, color: "cyan" },
      { label: "Study Exchange", href: "/marketplace", icon: Store, color: "cyan" },
    ],
  },
  {
    label: null,
    items: [
      { label: "Profile", href: "/profile", icon: User, color: "gray" },
    ],
  },
];

// Flattened for all-items lookup
const allNavItems = navGroups.flatMap((g) => g.items);

const colorMap: Record<string, { active: string; icon: string; border: string; glow: string }> = {
  amber: { active: "bg-amber-500/[0.09] text-amber-600 dark:text-amber-400", icon: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  blue: { active: "bg-blue-500/[0.08] text-blue-600 dark:text-blue-400", icon: "text-blue-600 dark:text-blue-400", border: "border-blue-400/20", glow: "shadow-blue-400/10" },
  emerald: { active: "bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-400/20", glow: "shadow-emerald-400/10" },
  violet: { active: "bg-violet-500/[0.08] text-violet-600 dark:text-violet-400", icon: "text-violet-600 dark:text-violet-400", border: "border-violet-400/20", glow: "shadow-violet-400/10" },
  rose: { active: "bg-rose-500/[0.08] text-rose-600 dark:text-rose-400", icon: "text-rose-600 dark:text-rose-400", border: "border-rose-400/20", glow: "shadow-rose-400/10" },
  cyan: { active: "bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-400", icon: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-400/20", glow: "shadow-cyan-400/10" },
  gray: { active: "bg-muted text-foreground", icon: "text-muted-foreground", border: "border-border", glow: "" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Pre-warm all sidebar routes so navigation is instant
  useEffect(() => {
    allNavItems.forEach((item) => router.prefetch(item.href));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- prefetch once on mount only

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r border-border/30 bg-sidebar/98 backdrop-blur-2xl transition-all duration-300 flex flex-col shadow-[1px_0_0_0_oklch(1_0_0_/_4%)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          collapsed ? "md:w-[60px]" : "md:w-60"
        )}
      >
        {/* Brand accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

        {/* Mobile close */}
        <div className="flex items-center justify-end p-2 md:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden md:flex items-center justify-end px-2 py-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </motion.button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-6 space-y-5">
          {navGroups.map((group, gi) => (
            <div key={group.label ?? `top-${gi}`}>
              {/* Group label */}
              {group.label && !collapsed && (
                <div className="flex items-center gap-2 px-3 mb-1">
                  <p className="nav-group-label text-muted-foreground/50 font-display">
                    {group.label}
                  </p>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
              )}
              {group.label && collapsed && <div className="my-1 mx-2 h-px bg-border/40" />}

              <div className="space-y-0.5">
                {group.items.map((item, index) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const colors = colorMap[item.color] || colorMap.amber;

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.18, ease: "easeOut" }}
                    >
                      <div className={cn(isActive && "relative overflow-hidden rounded-xl")}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 group",
                            collapsed && "md:justify-center md:px-0 md:py-2.5",
                            isActive
                              ? `${colors.active} shadow-sm ${colors.glow} shadow-[inset_0_0_16px_rgba(249,115,22,0.07)]`
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/35 hover:shadow-[inset_0_1px_0_0_oklch(1_0_0_/_5%)]"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active-bg"
                              className={cn("absolute inset-0 rounded-xl border", colors.active, colors.border)}
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-amber-300 via-amber-500 to-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.7),0_0_4px_rgba(251,146,60,0.4)]"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                          <Icon className={cn(
                            "h-4 w-4 relative z-10 shrink-0 transition-colors",
                            isActive ? colors.icon : "group-hover:text-foreground"
                          )} />
                          {!collapsed && (
                            <span className="md:inline relative z-10 truncate">{item.label}</span>
                          )}
                          {collapsed && (
                            <span className="md:hidden relative z-10">{item.label}</span>
                          )}
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-sidebar to-transparent pointer-events-none" />
      </aside>
    </>
  );
}
