"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, CheckCircle2, Loader2, CloudUpload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function FileUploadZone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [done, setDone] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
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
      setProgress(30);
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      setProgress(80);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setProgress(100);
      setDone(true);
      toast.success("PDF uploaded successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
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
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

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
      {/* Drag overlay glow */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] pointer-events-none" />
      )}

      <AnimatePresence mode="wait">
        {uploading ? (
          /* ── Uploading state ── */
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
                {done ? "Upload complete!" : "Uploading…"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                {fileName}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-1.5">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground/60 text-right tabular-nums">{progress}%</p>
            </div>
          </motion.div>
        ) : (
          /* ── Idle state ── */
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-5 px-8 py-14 text-center"
          >
            {/* Icon */}
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
                  : <Upload className="w-7 h-7 text-amber-500/80" />
                }
              </motion.div>
            </div>

            {/* Text */}
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {isDragging ? "Release to upload" : "Drop your PDF here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                or{" "}
                <label className="text-amber-600 dark:text-amber-400 underline underline-offset-4 cursor-pointer hover:text-amber-500 transition-colors font-medium">
                  browse files
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                </label>
                {" "}from your computer
              </p>
            </div>

            {/* Format tags */}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground/50">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                <span>PDF only</span>
              </div>
              <span>·</span>
              <span>Max 10 MB</span>
            </div>

            {/* Hidden full-area click target */}
            <label className="absolute inset-0 cursor-pointer">
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
