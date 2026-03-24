"use client";

import StudyCalendar from "./StudyCalendar";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function CalendarShell() {
  const { readyPacks } = useStudyData();
  return <StudyCalendar studyPacks={readyPacks} />;
}
