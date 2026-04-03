"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  documentId: string;
  hasStudyPack?: boolean;
  studyPackId?: string;
}

export default function GenerateButton({
  documentId,
  hasStudyPack,
  studyPackId,
}: GenerateButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  if (hasStudyPack && studyPackId) {
    return (
      <Link href={`/study-packs/${studyPackId}`}>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] rounded-md">
          View Pack
        </Button>
      </Link>
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/study-packs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study pack");
      }

      toast.success("Study pack generated successfully!");
      router.refresh();
      router.push(`/study-packs/${data.studyPack._id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate study pack"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Generating... (this may take a minute)
        </span>
      ) : (
        "Generate Study Pack"
      )}
    </Button>
  );
}
