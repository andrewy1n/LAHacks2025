import { useEffect, useState } from "react";
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

// 🛠 Custom timing for each stage (in milliseconds)
const stageDurations = [1000, 2000, 1500, 2000, 3000, 2000];

export default function TreeLoading() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (currentStage < treeImages.length) {
      const timer = setTimeout(() => {
        setCurrentStage((prev) => prev + 1);
      }, stageDurations[currentStage]);
      return () => clearTimeout(timer);
    }
  }, [currentStage]);

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
                <p className="stage-heading">
                  {stageHeadings[index]}
                </p>
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
