"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Target,
  MessageSquare,
  PenTool,
  CalendarDays,
  BarChart3,
  CalendarRange,
  Brain,
  History,
} from "lucide-react";

const actions = [
  { label: "Focus Mode", href: "/focus", icon: Target, color: "text-orange-500", bg: "bg-orange-500/10", hoverBorder: "hover:border-orange-500/20" },
  { label: "AI Tutor", href: "/chat", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10", hoverBorder: "hover:border-blue-400/20" },
  { label: "Practice Essay", href: "/practice-essay", icon: PenTool, color: "text-rose-400", bg: "bg-rose-400/10", hoverBorder: "hover:border-rose-400/20" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, color: "text-emerald-400", bg: "bg-emerald-400/10", hoverBorder: "hover:border-emerald-400/20" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, color: "text-violet-400", bg: "bg-violet-400/10", hoverBorder: "hover:border-violet-400/20" },
  { label: "Study Plan", href: "/study-plan", icon: CalendarRange, color: "text-amber-400", bg: "bg-amber-400/10", hoverBorder: "hover:border-amber-400/20" },
  { label: "Knowledge Graph", href: "/knowledge-graph", icon: Brain, color: "text-cyan-400", bg: "bg-cyan-400/10", hoverBorder: "hover:border-cyan-400/20" },
  { label: "History", href: "/history", icon: History, color: "text-gray-400", bg: "bg-gray-400/10", hoverBorder: "hover:border-gray-400/20" },
];

export default function DashboardQuickActions() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <Link href={action.href}>
                <div className={`group relative rounded-xl border border-border/50 bg-card p-4 hover:shadow-md transition-all duration-300 cursor-pointer h-full ${action.hoverBorder} overflow-hidden`}>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4.5 h-4.5 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                      {action.label}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
