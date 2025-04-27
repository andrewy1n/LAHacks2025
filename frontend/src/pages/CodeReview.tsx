import { useState } from "react";
import { html } from "diff2html";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "diff2html/bundles/css/diff2html.min.css";
import "../styles/CodeReview.css";

export default function CodeReviewPage() {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<"diff" | "original">("diff");

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

  const originalCodeString = `
function greetUser(name) {
  console.log("Hello " + name + "!");
}

function calculateSum(a, b) {
  return a + b;
}

function findMax(numbers) {
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}

function startApp() {
  console.log("Starting application...");
}

greetUser("Alice");
console.log(calculateSum(5, 10));
console.log(findMax([3, 7, 2, 9, 5]));
startApp();
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
  console.log("Initializing application...");
}

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

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "diff" ? "original" : "diff"));
  };

  const handleDetailedChangesClick = () => {
    setShowFullScreen(true);
    setViewMode("diff");
  };

  return (
    <div className="code-review-page p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center flex-1">
          Code Sustainability Improvements
        </h1>

        {showFullScreen && (
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm ml-4"
            onClick={toggleViewMode}
          >
            {viewMode === "diff" ? "See Original" : "Back to Changes"}
          </button>
        )}
      </div>

      {!showFullScreen ? (
        <>
          {/* Default preview screen */}
          <div className="diff-block-container border rounded overflow-auto max-h-[600px] p-0">
            <div className="file-header bg-gray-100 text-gray-800 px-4 py-2 font-mono text-sm border-b">
              file.js [CHANGED]
            </div>
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              showLineNumbers
              wrapLines
              customStyle={{
                borderRadius: "0 0 0.5rem 0.5rem",
                fontSize: "0.9rem",
                backgroundColor: "#1e1e1e",
                padding: "1rem",
                maxHeight: "600px",
                overflowX: "auto",
                marginTop: "0",
              }}
            >
              {newCodeString.trim()}
            </SyntaxHighlighter>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleDetailedChangesClick}
            >
              See Detailed Changes
            </button>

            <div className="flex gap-2">
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
        </>
      ) : (
        <>
          {/* Detailed view screen */}
          <div className="diff-block-container border rounded overflow-auto max-h-[600px]">
            <div className="file-header bg-gray-100 text-gray-800 px-4 py-2 font-mono text-sm border-b">
              file.js{" "}
              {viewMode === "diff" ? (
                <span className="text-yellow-500 ml-2">CHANGED</span>
              ) : (
                <span className="text-blue-500 ml-2">ORIGINAL</span>
              )}
            </div>
            {viewMode === "diff" ? (
              <div
                className="diff2html-wrapper"
                dangerouslySetInnerHTML={{
                  __html: html(diffString, {
                    outputFormat: "line-by-line",
                    drawFileList: false,
                    matching: "lines",
                  }),
                }}
              />
            ) : (
              <SyntaxHighlighter
                language="javascript"
                style={vscDarkPlus}
                showLineNumbers
                wrapLines
                customStyle={{
                  borderRadius: "0 0 0.5rem 0.5rem",
                  fontSize: "0.9rem",
                  backgroundColor: "#1e1e1e",
                  padding: "1rem",
                  maxHeight: "550px",
                  overflowX: "auto",
                  marginTop: "0",
                }}
              >
                {originalCodeString.trim()}
              </SyntaxHighlighter>
            )}
          </div>

          <div className="flex justify-end items-center mt-6">
            <div className="flex gap-2">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                onClick={handleAcceptChanges}
              >
                Accept New Changes
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                onClick={handleDeclineChanges}
              >
                Keep Original
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
