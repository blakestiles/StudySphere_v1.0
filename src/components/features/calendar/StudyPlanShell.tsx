"use client";

import StudyPlanGenerator from "./StudyPlanGenerator";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function StudyPlanShell() {
  const { readyPacks } = useStudyData();
  return <StudyPlanGenerator studyPacks={readyPacks} />;
}
