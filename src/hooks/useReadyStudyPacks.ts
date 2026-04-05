"use client";

import { useState, useEffect } from "react";

export type StudyPackOption = { _id: string; title: string; examDate?: string | null };

export function useReadyStudyPacks(): StudyPackOption[] {
  const [packs, setPacks] = useState<StudyPackOption[]>([]);

  useEffect(() => {
    fetch("/api/study-packs")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        setPacks(
          data
            .filter((sp: any) => sp.status === "ready")
            .map((sp: any) => ({
              _id: String(sp._id),
              title: String(sp.title),
              examDate: sp.examDate ? String(sp.examDate) : null,
            }))
        );
      })
      .catch((err) => console.error("Failed to fetch study packs:", err));
  }, []);

  return packs;
}
