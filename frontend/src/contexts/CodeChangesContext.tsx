// src/contexts/CodeChangesContext.tsx

import { createContext, useContext, useState, ReactNode } from "react";

interface FinalizedFile {
  filename: string;
  content: string; // Final selected content
}

interface CodeChangesContextType {
  finalizedFiles: FinalizedFile[];
  addFinalizedFile: (file: FinalizedFile) => void;
  resetFinalizedFiles: () => void;
}

const CodeChangesContext = createContext<CodeChangesContextType | undefined>(undefined);

export function useCodeChanges() {
  const context = useContext(CodeChangesContext);
  if (!context) {
    throw new Error("useCodeChanges must be used within a CodeChangesProvider");
  }
  return context;
}

export function CodeChangesProvider({ children }: { children: ReactNode }) {
  const [finalizedFiles, setFinalizedFiles] = useState<FinalizedFile[]>([]);

  const addFinalizedFile = (file: FinalizedFile) => {
    setFinalizedFiles((prev) => [...prev, file]);
  };

  const resetFinalizedFiles = () => {
    setFinalizedFiles([]);
  };

  return (
    <CodeChangesContext.Provider value={{ finalizedFiles, addFinalizedFile, resetFinalizedFiles }}>
      {children}
    </CodeChangesContext.Provider>
  );
}
