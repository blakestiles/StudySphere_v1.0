"use client";

import FocusMode from "./FocusMode";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function FocusShell() {
  const { readyPacks } = useStudyData();
  return <FocusMode studyPacks={readyPacks} />;
}
