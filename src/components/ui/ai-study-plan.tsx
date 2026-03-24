"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  CircleDotDashed,
  CircleAlert,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Brain,
  FileText,
  Layers,
  ClipboardCheck,
  Target,
  Timer,
} from "lucide-react";

type Status = "completed" | "in-progress" | "pending";

interface Subtask {
  id: string;
  title: string;
  status: Status;
}

interface Task {
  id: string;
  title: string;
  status: Status;
  icon: React.ReactNode;
  subtasks: Subtask[];
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Review Biology Notes",
    status: "completed",
    icon: <BookOpen className="w-4 h-4" />,
    subtasks: [
      { id: "1.1", title: "Read Chapter 5 — Cell Division", status: "completed" },
      { id: "1.2", title: "Highlight key terms", status: "completed" },
      { id: "1.3", title: "Generate mind map", status: "completed" },
    ],
  },
  {
    id: "2",
    title: "Generate Flashcard Set",
    status: "in-progress",
    icon: <Brain className="w-4 h-4" />,
    subtasks: [
      { id: "2.1", title: "Upload lecture slides", status: "completed" },
      { id: "2.2", title: "AI creates 40 flashcards", status: "in-progress" },
      { id: "2.3", title: "Review and rate difficulty", status: "pending" },
    ],
  },
  {
    id: "3",
    title: "Complete Practice Quiz",
    status: "pending",
    icon: <ClipboardCheck className="w-4 h-4" />,
    subtasks: [
      { id: "3.1", title: "Take adaptive MCQ quiz", status: "pending" },
      { id: "3.2", title: "Review wrong answers", status: "pending" },
    ],
  },
  {
    id: "4",
    title: "Exam Simulation",
    status: "pending",
    icon: <Target className="w-4 h-4" />,
    subtasks: [
      { id: "4.1", title: "Run proctored mock exam", status: "pending" },
      { id: "4.2", title: "Analyze weak areas", status: "pending" },
    ],
  },
];

function StatusIcon({ status, className }: { status: Status; className?: string }) {
  if (status === "completed") {
    return <CheckCircle2 className={cn("w-4 h-4 text-green-500", className)} />;
  }
  if (status === "in-progress") {
    return <CircleDotDashed className={cn("w-4 h-4 text-amber-500", className)} />;
  }
  return <Circle className={cn("w-4 h-4 text-white/20", className)} />;
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "completed") {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
        Completed
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
        In Progress
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-white/[0.04] text-white/30">
      Pending
    </span>
  );
}

export function AIStudyPlan() {
  const [expanded, setExpanded] = useState<string[]>(["1", "2"]);

  function toggle(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c16] overflow-hidden w-full max-w-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">AI Study Plan</p>
        <h3 className="text-base font-semibold text-white">Biology Midterm Prep</h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
          <Timer className="w-3.5 h-3.5" />
          <span>4 tasks · Est. 3h 20min</span>
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-white/[0.04]">
        {tasks.map((task) => {
          const isExpanded = expanded.includes(task.id);

          return (
            <div key={task.id}>
              {/* Task row */}
              <motion.button
                className="w-full flex items-center gap-3 px-5 py-3 text-left"
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                onClick={() => toggle(task.id)}
              >
                <StatusIcon status={task.status} />
                <span
                  className={cn(
                    "flex-1 text-sm font-medium",
                    task.status === "completed" ? "text-white/50 line-through" : "text-white/80"
                  )}
                >
                  {task.title}
                </span>
                <StatusBadge status={task.status} />
                <span className="text-white/30 ml-1">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              </motion.button>

              {/* Subtasks */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="subtasks"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 pl-4 border-l border-white/[0.06] pb-2">
                      {task.subtasks.map((subtask, idx) => (
                        <motion.div
                          key={subtask.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.15 }}
                        >
                          <motion.div
                            className="flex items-center gap-3 px-4 py-2 rounded-lg"
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                          >
                            <StatusIcon status={subtask.status} className="w-3.5 h-3.5" />
                            <span
                              className={cn(
                                "flex-1 text-xs",
                                subtask.status === "completed"
                                  ? "text-white/30 line-through"
                                  : "text-white/50"
                              )}
                            >
                              {subtask.title}
                            </span>
                            <StatusBadge status={subtask.status} />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AIStudyPlan;
