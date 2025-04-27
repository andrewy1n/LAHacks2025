// src/contexts/AnalysisContext.tsx

import { createContext, useContext, useState, ReactNode } from "react";

type Issue = any;
type FileEntry = {
  filename: string;
  original: string;
  optimized: string;
};

interface AnalysisData {
  repoUrl: string | null; 
  carbon: string | null;
  issues: Issue[];
  metrics: any;
  files: FileEntry[];
}

interface AnalysisContextType extends AnalysisData {
  setAnalysisData: (data: Partial<AnalysisData>) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisDataState] = useState<AnalysisData>({
    repoUrl: null,
    carbon: null,
    issues: [],
    metrics: null,
    files: [],
  });

  const setAnalysisData = (data: Partial<AnalysisData>) => {
    setAnalysisDataState((prev) => ({ ...prev, ...data }));
  };

  return (
    <AnalysisContext.Provider value={{ ...analysisData, setAnalysisData }}>
      {children}
    </AnalysisContext.Provider>
  );
}
