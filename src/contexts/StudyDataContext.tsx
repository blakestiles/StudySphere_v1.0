"use client";

import { createContext, useContext } from "react";
import type { StudyPackOption } from "@/hooks/useReadyStudyPacks";

interface StudyDataContextValue {
  readyPacks: StudyPackOption[];
}

const StudyDataContext = createContext<StudyDataContextValue>({ readyPacks: [] });

export function StudyDataProvider({
  children,
  readyPacks,
}: {
  children: React.ReactNode;
  readyPacks: StudyPackOption[];
}) {
  return (
    <StudyDataContext.Provider value={{ readyPacks }}>
      {children}
    </StudyDataContext.Provider>
  );
}

export function useStudyData() {
  return useContext(StudyDataContext);
}
