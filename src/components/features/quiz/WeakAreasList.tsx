"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WeakArea {
  _id: string;
  topicId: { _id: string; name: string; studyPackId: string };
  severity: "low" | "medium" | "high";
  lastUpdated: string;
}

interface WeakAreasListProps {
  weakAreas: WeakArea[];
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const severityConfig = {
  high: { label: "High", variant: "destructive" as const, className: "" },
  medium: { label: "Medium", variant: "outline" as const, className: "border-yellow-500 text-yellow-700 bg-yellow-50" },
  low: { label: "Low", variant: "secondary" as const, className: "" },
};

export default function WeakAreasList({ weakAreas }: WeakAreasListProps) {
  if (weakAreas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No weak areas identified yet. Take a quiz to get started!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {weakAreas.map((wa) => {
        const config = severityConfig[wa.severity];
        return (
          <div
            key={wa._id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Badge
                variant={config.variant}
                className={cn(config.className)}
              >
                {config.label}
              </Badge>
              <div>
                <Link
                  href={`/study-packs/${wa.topicId.studyPackId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {wa.topicId.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {getRelativeTime(wa.lastUpdated)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
