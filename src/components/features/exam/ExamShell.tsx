"use client";

import ExamSimulator from "./ExamSimulator";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function ExamShell() {
  const { readyPacks } = useStudyData();
  return <ExamSimulator studyPacks={readyPacks} />;
}
