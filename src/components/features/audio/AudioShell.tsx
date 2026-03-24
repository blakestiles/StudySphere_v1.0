"use client";

import AudioStudyPlayer from "./AudioStudyPlayer";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function AudioShell() {
  const { readyPacks } = useStudyData();
  return <AudioStudyPlayer studyPacks={readyPacks} />;
}
