import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useAnalysis } from "../contexts/AnalysisContext";
import "../styles/TreeLoading.css";

import tree1 from "../assets/tree-1.svg";
import tree2 from "../assets/tree-2.svg";
import tree3 from "../assets/tree-3.svg";
import tree4 from "../assets/tree-4.svg";
import tree5 from "../assets/tree-5.svg";
import tree6 from "../assets/tree-6.svg";

const treeImages = [tree1, tree2, tree3, tree4, tree5, tree6];

const stageHeadings = [
  "Analyzing Page Performance (Efficiency)",
  "Analyzing Hosting Infrastructure",
  "Checking Frontend Efficiency (Code & Assets)",
  "Checking SEO and Accessibility Best Practices",
  "Finalizing Overall Performance Report",
  "Generating Emissions and Efficiency Summary",
];

const stageDurations = [1000, 2000, 1500, 2000, 3000, 2000];

export default function TreeLoading() {
  const navigate = useNavigate();
  const { repoUrl, setAnalysisData } = useAnalysis();

  const [currentStage, setCurrentStage] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    if (!repoUrl) {
      alert("No GitHub URL found! Please start again.");
      navigate("/gitlink");
      return;
    }
  
    const baseUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${baseUrl}analyze?github_url=${encodeURIComponent(repoUrl)}`;
  
    console.log("Connecting to EventSource URL:", fullUrl);
  
    const eventSource = new EventSourcePolyfill(fullUrl, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
  
    eventSource.onopen = () => {
      console.log("[SSE Connection OPENED]");
    };
  
    let issues: any[] = [];
    let metrics: any = null;
    let carbon: string | null = null;
    let files: { filename: string; original: string; optimized: string }[] = [];
  
    const handlers: { [key: string]: (value: string) => void } = {
      carbon_per_view: (value) => {
        try {
          carbon = JSON.parse(value).carbon_per_view.toFixed(4); 
          console.log("carbon"+ carbon);
        } catch (err) {
          console.error("Failed to parse carbon_per_view", err);
        }
      },
      metrics: (value) => {
        try {
          metrics = JSON.parse(value);
          console.log("value"+ value);
        } catch (err) {
          console.error("Failed to parse metrics", err);
        }
      },
      issues: (value) => {
        try {
          issues = JSON.parse(value);
          console.log("issues"+ issues);
        } catch (err) {
          console.error("Failed to parse issues", err);
        }
      },
      path: (value) => files.push({ filename: value, original: "", optimized: "" }),
      original: (value) => {
        const lastFile = files[files.length - 1];
        if (lastFile) lastFile.original = value;
      },
      optimized: (value) => {
        const lastFile = files[files.length - 1];
        if (lastFile) lastFile.optimized = value;
      },
    };
  
    eventSource.onmessage = (event) => {
      const data = event.data;
      console.log("[SSE]", data);
  
      let matched = false;
      for (const key in handlers) {
        if (data.startsWith(`${key}:`)) {
          const value = data.slice(key.length + 1).trim();
          handlers[key](value);
          matched = true;
          break;
        }
      }
  
      if (!matched) {
        if (data.includes("🎉 All done")) {
          console.log("[SSE] All done received!");

          console.log("[FINAL DATA BEFORE SETTING CONTEXT]", {
            carbon,
            metrics,
            issues,
            files,
          });

          eventSource.close();
  
          setAnalysisData({
            carbon,
            issues,
            metrics,
            files,
          });
  
          setAnalysisComplete(true);
        } else {
          console.log("[SSE PROGRESS LOG]", data);
        }
      }
    };
  
    eventSource.onerror = (err) => {
      console.error("[SSE ERROR]", err);
      eventSource.close();
      setAnalysisComplete(true);
    };
  
    return () => {
      eventSource.close();
    };
  }, [navigate, repoUrl, setAnalysisData]);
  

  useEffect(() => {
    if (currentStage < treeImages.length) {
      const timer = setTimeout(() => {
        setCurrentStage((prev) => prev + 1);
      }, stageDurations[currentStage]);
      return () => clearTimeout(timer);
    } else if (analysisComplete) {
      navigate("/summary");
    }
  }, [currentStage, analysisComplete, navigate]);

  return (
    <div className="tree-loading-container">
      <div className="tree-grid">
        {treeImages.map((src, index) => {
          const isActive = index === currentStage;
          return (
            <div key={index} className="tree-box">
              <img
                src={src}
                alt={`Tree ${index + 1}`}
                className={`tree-image ${isActive ? "tree-active" : "tree-inactive"}`}
              />
              {isActive && (
                <p className="stage-heading">{stageHeadings[index]}</p>
              )}
            </div>
          );
        })}
      </div>

      {currentStage >= treeImages.length && (
        <p className="final-message">
          🌳 All checks finished — your eco insights are ready!
        </p>
      )}
    </div>
  );
}

