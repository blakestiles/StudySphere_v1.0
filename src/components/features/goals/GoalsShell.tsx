"use client";

import GoalTracker from "./GoalTracker";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function GoalsShell({ goals }: { goals: any[] }) {
  const { readyPacks } = useStudyData();
  return <GoalTracker goals={goals} studyPacks={readyPacks} />;
}
