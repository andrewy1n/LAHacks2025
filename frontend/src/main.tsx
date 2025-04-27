import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import "./index.css";
import { CodeChangesProvider } from "./contexts/CodeChangesContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CodeChangesProvider>
    <AnalysisProvider>
      <App />
    </AnalysisProvider>
    </CodeChangesProvider>
  </StrictMode>
);
