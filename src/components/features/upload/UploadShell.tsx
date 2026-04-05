"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Type, Link, Image, BookOpen } from "lucide-react";
import FileUploadZone from "./FileUploadZone";
import TextPasteForm from "./TextPasteForm";
import UrlImportForm from "./UrlImportForm";
import ImageUploadZone from "./ImageUploadZone";
import NotionGDocsForm from "./NotionGDocsForm";

type Method = "pdf" | "text" | "url" | "image" | "import";

const methods = [
  { id: "pdf" as Method, label: "PDF", description: "Upload a PDF file", icon: FileText },
  { id: "image" as Method, label: "Photo", description: "Handwritten notes or photos", icon: Image },
  { id: "text" as Method, label: "Text", description: "Paste your notes", icon: Type },
  { id: "url" as Method, label: "YouTube / Web", description: "Import from a URL", icon: Link },
  { id: "import" as Method, label: "Notion / GDocs", description: "Import from apps", icon: BookOpen },
];

export default function UploadShell() {
  const [method, setMethod] = useState<Method>("pdf");

  return (
    <div className="space-y-5">
      {/* Method selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {methods.map(({ id, label, description, icon: Icon }) => {
          const active = method === id;
          return (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`group relative flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                active
                  ? "border-amber-500/35 bg-amber-500/[0.06] shadow-[0_0_0_1px_oklch(0.76_0.17_62_/_12%)]"
                  : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
              )}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                active
                  ? "bg-amber-500/12 border-amber-500/25 text-amber-500"
                  : "bg-muted/50 border-border/50 text-muted-foreground group-hover:text-foreground"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate transition-colors ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{description}</p>
              </div>
              {active && <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={method}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {method === "pdf" && <FileUploadZone />}
          {method === "text" && <TextPasteForm />}
          {method === "image" && <ImageUploadZone />}
          {method === "url" && <UrlImportForm />}
          {method === "import" && <NotionGDocsForm />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
