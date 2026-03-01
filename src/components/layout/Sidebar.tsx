"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "orange" },
  { label: "Upload", href: "/upload", icon: Upload, color: "amber" },
  { label: "Documents", href: "/documents", icon: FileText, color: "blue" },
  { label: "Study Packs", href: "/study-packs", icon: BookOpen, color: "orange" },
  { label: "Focus Mode", href: "/focus", icon: Target, color: "rose" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, color: "emerald" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, color: "violet" },
  { label: "Practice Essay", href: "/practice-essay", icon: PenTool, color: "rose" },
  { label: "AI Tutor", href: "/chat", icon: MessageSquare, color: "blue" },
  { label: "Study Plan", href: "/study-plan", icon: CalendarRange, color: "amber" },
  { label: "Knowledge Graph", href: "/knowledge-graph", icon: Brain, color: "cyan" },
  { label: "History", href: "/history", icon: History, color: "gray" },
  { label: "Profile", href: "/profile", icon: User, color: "orange" },
];

const colorMap: Record<string, { active: string; icon: string; border: string }> = {
  orange: { active: "bg-orange-500/[0.08] text-orange-500", icon: "text-orange-500", border: "border-orange-500/20" },
  amber: { active: "bg-amber-500/[0.08] text-amber-500", icon: "text-amber-500", border: "border-amber-500/20" },
  blue: { active: "bg-blue-500/[0.08] text-blue-400", icon: "text-blue-400", border: "border-blue-400/20" },
  emerald: { active: "bg-emerald-500/[0.08] text-emerald-400", icon: "text-emerald-400", border: "border-emerald-400/20" },
  violet: { active: "bg-violet-500/[0.08] text-violet-400", icon: "text-violet-400", border: "border-violet-400/20" },
  rose: { active: "bg-rose-500/[0.08] text-rose-400", icon: "text-rose-400", border: "border-rose-400/20" },
  cyan: { active: "bg-cyan-500/[0.08] text-cyan-400", icon: "text-cyan-400", border: "border-cyan-400/20" },
  gray: { active: "bg-muted text-foreground", icon: "text-muted-foreground", border: "border-border" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r border-border/40 bg-sidebar/95 backdrop-blur-xl transition-all duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          collapsed ? "md:w-[68px]" : "md:w-64"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-2 md:hidden">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden md:flex items-center justify-end px-3 py-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        <nav className="space-y-0.5 px-2 md:px-2 overflow-y-auto h-[calc(100%-3rem)]">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const colors = colorMap[item.color] || colorMap.orange;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "md:justify-center md:px-2",
                    isActive
                      ? `${colors.active}`
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className={cn(
                        "absolute inset-0 rounded-xl border",
                        colors.active,
                        colors.border
                      )}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {/* Active left indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-orange-500 to-amber-500"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={cn(
                    "h-[18px] w-[18px] relative z-10 shrink-0 transition-colors",
                    isActive ? colors.icon : ""
                  )} />
                  {!collapsed && <span className="md:inline relative z-10">{item.label}</span>}
                  {collapsed && <span className="md:hidden relative z-10">{item.label}</span>}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-sidebar to-transparent pointer-events-none" />
      </aside>
    </>
  );
}
