"use client";

import NotebookList from "./NotebookList";
import { useStudyData } from "@/contexts/StudyDataContext";

export default function NotebooksShell({ notebooks }: { notebooks: any[] }) {
  const { readyPacks } = useStudyData();
  return <NotebookList notebooks={notebooks} studyPacks={readyPacks} />;
}
