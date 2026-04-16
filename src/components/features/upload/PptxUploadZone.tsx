"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Presentation, CheckCircle2, Loader2, CloudUpload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function PptxUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [done, setDone] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    const isPptx =
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.name.toLowerCase().endsWith(".pptx");

    if (!isPptx) {
      toast.error("Only .pptx files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB");
      return;
    }

    setUploading(true);
    setDone(false);
    setFileName(file.name);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(35);
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      setProgress(85);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setProgress(100);
      setDone(true);
      toast.success("Presentation imported! Slides extracted per slide.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setDone(false);
        setFileName("");
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- all captured values are stable state setters
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
        isDragging
          ? "border-amber-500/60 bg-amber-500/[0.05] scale-[1.005]"
          : "border-border/60 bg-card hover:border-amber-500/30 hover:bg-amber-500/[0.02]"
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] pointer-events-none" />
      )}

      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 px-8 py-14 text-center"
          >
            <div className="relative">
              {done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
                >
                  <Loader2 className="w-7 h-7 text-amber-500" />
                </motion.div>
              )}
            </div>
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {done ? "Import complete!" : "Extracting slides…"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">{fileName}</p>
            </div>
            <div className="w-full max-w-xs space-y-1.5">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground/60 text-right tabular-nums">{progress}%</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 px-8 py-14 text-center"
          >
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-300 ${isDragging ? "bg-amber-500/30" : "bg-amber-500/15"}`} />
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                  isDragging
                    ? "bg-amber-500/15 border-amber-500/40"
                    : "bg-amber-500/8 border-amber-500/20"
                }`}
              >
                {isDragging
                  ? <CloudUpload className="w-7 h-7 text-amber-500" />
                  : <Presentation className="w-7 h-7 text-amber-500/80" />
                }
              </motion.div>
            </div>

            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {isDragging ? "Release to import" : "Drop your slides here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                or{" "}
                <label className="text-amber-600 dark:text-amber-400 underline underline-offset-4 cursor-pointer hover:text-amber-500 transition-colors font-medium">
                  browse files
                  <input type="file" accept=".pptx" className="hidden" onChange={handleFileSelect} />
                </label>
                {" "}from your computer
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground/50">
              <div className="flex items-center gap-2">
                <Presentation className="h-3 w-3" />
                <span>PowerPoint (.pptx) only</span>
                <span>·</span>
                <span>Max 10 MB</span>
              </div>
              <p className="text-muted-foreground/40">Slide titles and text are extracted per slide</p>
            </div>

            <label className="absolute inset-0 cursor-pointer">
              <input type="file" accept=".pptx" className="hidden" onChange={handleFileSelect} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
