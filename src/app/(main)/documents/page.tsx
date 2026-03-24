"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import ShimmerButton from "@/components/ui/shimmer-button";
import BlurFade from "@/components/ui/blur-fade";
import { SparklesText } from "@/components/ui/sparkles-text";

interface DocumentData {
  _id: string;
  title: string;
  fileType: string;
  uploadedAt: string;
  status: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">All your uploaded documents</p>
        </div>
        <Link href="/upload">
          <ShimmerButton className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl">
            Upload New
          </ShimmerButton>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <SparklesText text="No Documents Yet" className="text-xl font-semibold text-white/70" />
          <p className="mt-2 text-muted-foreground text-sm">Upload your first document to get started.</p>
          <Link href="/upload" className="mt-4">
            <ShimmerButton className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl">
              Upload Document
            </ShimmerButton>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => (
            <BlurFade key={doc._id} delay={index * 0.05}>
              <Link href={`/documents/${doc._id}`}>
                  <div className="pt-6 px-6 pb-6 rounded-2xl border border-border/60 bg-card group hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-orange-400 transition-colors duration-200">{doc.title}</h3>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {doc.fileType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <Badge
                        variant={doc.status === "ready" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}
