import { useState } from "react";
import { html } from "diff2html";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "diff2html/bundles/css/diff2html.min.css";
import "../styles/CodeReview.css"; 

export default function CodeReviewPage() {
  const [showFullDiff, setShowFullDiff] = useState(false);

  const diffString = `
diff --git a/file.js b/file.js
index 83db48f..bf269f4 100644
--- a/file.js
+++ b/file.js
@@ -1,11 +1,16 @@
 function greetUser(name) {
-  console.log("Hello " + name + "!");
+  console.log("Hello, " + name + "!");
 }
 
-function calculateSum(a, b) {
-  return a + b;
+function calculateTotal(a, b) {
+  return a + b + 0.5;
 }
 
 function findMax(numbers) {
   let max = numbers[0];
-  for (let i = 1; i < numbers.length; i++) {
-    if (numbers[i] > max) {
-      max = numbers[i];
-    }
-  }
-  return max;
+  return Math.max(...numbers);
 }
+
+function trackEnergyUsage() {
+  console.log("Tracking energy usage...");
+}
`;

  const newCodeString = `
function greetUser(userName) {
  console.log("Hello, " + userName + "!");
}

function calculateTotal(a, b) {
  return a + b + 0.5;
}

function findMax(numbers) {
  return Math.max(...numbers);
}

function initializeApp() {
  console.log("Initializing application... 🌿");
}

// New feature: track energy usage
function trackEnergyUsage() {
  console.log("Tracking energy usage...");
}

greetUser("Alice");
console.log(calculateTotal(5, 10));
console.log(findMax([3, 7, 2, 9, 5]));
initializeApp();
trackEnergyUsage();
`;

  const handleAcceptChanges = () => {
    console.log("Accepted changes!");
  };

  const handleDeclineChanges = () => {
    console.log("Declined changes.");
  };

  const toggleDiffView = () => {
    setShowFullDiff((prev) => !prev);
  };

  return (
    <div className="code-review-page p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Code Emission Improvements</h1>

      <div className="diff-block-container border rounded overflow-auto max-h-[600px] p-4">
        {showFullDiff ? (
          <div
            className="diff2html-wrapper"
            dangerouslySetInnerHTML={{
              __html: html(diffString, {
                outputFormat: "line-by-line",
                drawFileList: false,
                matching: "lines",
              })
            }}
          />
        ) : (
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            showLineNumbers
            wrapLines
            customStyle={{
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
              backgroundColor: "#1e1e1e",
              padding: "1rem",
              maxHeight: "600px",
              overflowX: "auto",
            }}
          >
            {newCodeString.trim()}
          </SyntaxHighlighter>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={toggleDiffView}
        >
          {showFullDiff ? "Hide Detailed Changes" : "See Detailed Changes"}
        </button>

        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleAcceptChanges}
        >
          Accept New Changes
        </button>

        <button
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          onClick={handleDeclineChanges}
        >
          Keep Original
        </button>
      </div>
    </div>
  );
}

