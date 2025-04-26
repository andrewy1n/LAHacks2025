import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from './App.tsx'
// import Landing from "./pages/Landing.tsx";
import Footprint from "./pages/Footprint.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Footprint />
  </StrictMode>
);
