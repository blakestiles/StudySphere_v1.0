"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Type } from "lucide-react";
import FileUploadZone from "./FileUploadZone";
import TextPasteForm from "./TextPasteForm";

const methods = [
  {
    id: "pdf" as const,
    label: "PDF Upload",
    description: "Drag & drop or browse files",
    icon: FileText,
  },
  {
    id: "text" as const,
    label: "Paste Text",
    description: "Copy & paste your content",
    icon: Type,
  },
];

export default function UploadShell() {
  const [method, setMethod] = useState<"pdf" | "text">("pdf");

  return (
    <div className="space-y-5">
      {/* Method selector */}
      <div className="grid grid-cols-2 gap-3">
        {methods.map(({ id, label, description, icon: Icon }) => {
          const active = method === id;
          return (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`group relative flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                active
                  ? "border-amber-500/35 bg-amber-500/[0.06] shadow-[0_0_0_1px_oklch(0.76_0.17_62_/_12%)]"
                  : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
              }`}
            >
              {/* Active indicator line */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
              )}

              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                active
                  ? "bg-amber-500/12 border-amber-500/25 text-amber-500"
                  : "bg-muted/50 border-border/50 text-muted-foreground group-hover:text-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>

              <div>
                <p className={`text-sm font-semibold transition-colors ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>
              </div>

              {active && (
                <div className="ml-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={method}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {method === "pdf" ? <FileUploadZone /> : <TextPasteForm />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
