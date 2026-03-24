"use client";

import EssayWriter from "./EssayWriter";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function EssayShell() {
  const { readyPacks } = useStudyData();
  return <EssayWriter studyPacks={readyPacks} />;
}
