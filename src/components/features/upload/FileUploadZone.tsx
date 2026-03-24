"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { SparklesText } from "@/components/ui/sparkles-text";

export default function FileUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");

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
    setFileName(file.name);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(30);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(80);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setProgress(100);
      toast.success("PDF uploaded successfully!");
      setFileName("");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
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
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative overflow-hidden border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer group ${
            isDragging
              ? "border-amber-500/60 bg-amber-500/[0.04] scale-[1.01]"
              : "border-border/80 hover:border-amber-500/30 hover:bg-amber-500/[0.02]"
          }`}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
                >
                  <Loader2 className="w-5 h-5 text-amber-500" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-foreground">Uploading {fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                </div>
                <Progress value={progress} className="w-full max-w-xs mx-auto h-1.5" />
                {progress === 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-emerald-500"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <SparklesText text="Upload Complete!" className="text-emerald-400 font-semibold text-sm" />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="w-14 h-14 mx-auto rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/12 group-hover:border-amber-500/25 transition-all"
                >
                  {isDragging ? (
                    <FileText className="w-6 h-6 text-amber-500" />
                  ) : (
                    <Upload className="w-6 h-6 text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                  )}
                </motion.div>
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    {isDragging ? "Drop your PDF here" : "Drag & drop your PDF"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    or click to browse — max 10MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/8 hover:border-amber-500/30"
                  asChild
                >
                  <label className="cursor-pointer gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
