"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, FileText, FileType } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GenerateButton from "@/components/features/study-packs/GenerateButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SerializedDocument {
  _id: string;
  title: string;
  fileType: "pdf" | "text";
  status: "processing" | "ready" | "error";
  uploadedAt: string;
}

export default function RecentDocuments({
  documents,
  studyPackMap = {},
}: {
  documents: SerializedDocument[];
  studyPackMap?: Record<string, string>;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete document");
      }
      toast.success(`"${title}" deleted`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">No documents yet</p>
        <Link href="/upload" className="text-orange-500 hover:text-orange-400 text-sm mt-2 inline-block transition-colors font-medium underline-offset-4 hover:underline">
          Upload your first document
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {documents.map((doc, index) => (
          <motion.div
            key={doc._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-colors duration-200">
                {doc.fileType === "pdf" ? (
                  <FileText className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                ) : (
                  <FileType className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground/70">
                  {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={doc.status === "ready" ? "default" : "secondary"}
                className={`text-xs ${
                  doc.status === "ready"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : doc.status === "processing"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {doc.status === "processing" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot mr-1.5" />
                )}
                {doc.status}
              </Badge>

              {doc.status === "ready" && (
                <GenerateButton
                  documentId={doc._id}
                  hasStudyPack={!!studyPackMap[doc._id]}
                  studyPackId={studyPackMap[doc._id]}
                />
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    disabled={deletingId === doc._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &ldquo;{doc.title}&rdquo; and
                      all related study packs, flashcards, and quiz questions. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(doc._id, doc.title)}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
