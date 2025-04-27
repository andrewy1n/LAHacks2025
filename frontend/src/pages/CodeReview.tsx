import { useEffect, useState } from "react";
import { html } from "diff2html";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "diff2html/bundles/css/diff2html.min.css";
import "../styles/CodeReview.css";

// --- Types ---
type FileType = {
  filename: string;
  originalCode: string;
  newCode: string;
  diff: string;
};

export default function CodeReviewPage() {
  const githubUrl = localStorage.getItem("github_repo_url");
  const installationId = localStorage.getItem("installation_id");

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"diff" | "original" | "new">("diff");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [error, setError] = useState("");
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

  useEffect(() => {
    if (!githubUrl || !installationId) {
      setError("Missing GitHub repository URL or installation ID.");
      setLoading(false);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL;
    const eventSource = new EventSource(
      `${baseUrl}/analyze?github_url=${encodeURIComponent(githubUrl)}&installation_id=${encodeURIComponent(installationId)}`
    );

    let tempFile: Partial<FileType> = {};

    eventSource.onmessage = (event) => {
      const data = event.data;
      console.log("[SSE]", data);

      if (data.startsWith("__PATCH__")) {
        const optimizedCode = data.replace("__PATCH__", "").trim();

        if (tempFile.filename && tempFile.originalCode) {
          const newDiff = generateDiff(tempFile.originalCode, optimizedCode);

          setFiles((prev) => [
            ...prev,
            {
              filename: tempFile.filename!,
              originalCode: tempFile.originalCode!,
              newCode: optimizedCode,
              diff: newDiff,
            },
          ]);
        }

        tempFile = {}; // Reset
      } else if (data.startsWith("Analyzing ")) {
        const filename = data.replace("Analyzing ", "").trim();
        setCurrentFilename(filename);
      } else if (
        data.startsWith("Got ") ||
        data.startsWith("Optimized code generated for ") ||
        data.includes("No suggestions") ||
        data.includes("Error") ||
        data.startsWith("data:")
      ) {
        // Ignore these
      } else {
        if (currentFilename) {
          tempFile = {
            filename: currentFilename,
            originalCode: data,
          };
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] Error:", error);
      eventSource.close();
      setLoading(false);
      setError("Error connecting to server or invalid GitHub URL / installation.");
    };

    return () => {
      eventSource.close();
    };
  }, [githubUrl, installationId]);

  const generateDiff = (oldCode: string, newCode: string) => {
    return `diff --git a/file.js b/file.js
--- a/file.js
+++ b/file.js
@@ -1,1 +1,1 @@
-${oldCode}
+${newCode}`;
  };

  const toggleViewMode = () => {
    if (viewMode === "diff") setViewMode("original");
    else if (viewMode === "original") setViewMode("new");
    else setViewMode("diff");
  };

  const handleAcceptChanges = () => {
    console.log("Accepted changes for", files[currentIndex].filename);
  };

  const handleDeclineChanges = () => {
    console.log("Kept original for", files[currentIndex].filename);
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl font-semibold animate-pulse mb-2">Loading Code Suggestions...</p>
        <p className="text-sm text-gray-500">Please wait while we process your files.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl font-semibold text-red-500">{error}</p>
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => {
            window.location.href = "/"; // redirect back to landing page
          }}
        >
          Go Back to Start
        </button>
      </div>
    );
  }

  const currentFile = files[currentIndex];

  return (
    <div className="code-review-page p-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex-1 text-center">
          Reviewing: {currentFile.filename}
        </h1>

        {showFullScreen && (
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm ml-4"
            onClick={toggleViewMode}
          >
            {viewMode === "diff"
              ? "See Original"
              : viewMode === "original"
              ? "See New Code"
              : "Back to Diff"}
          </button>
        )}
      </div>

      {/* Main Content */}
      {!showFullScreen ? (
        <>
          <div className="diff-block-container border rounded overflow-auto max-h-[600px]">
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
              {currentFile.newCode.trim()}
            </SyntaxHighlighter>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowFullScreen(true);
                setViewMode("diff");
              }}
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

          <div className="flex justify-between items-center mt-8">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((prev) => prev - 1);
                }
              }}
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            <p className="text-sm">
              File {currentIndex + 1} of {files.length}
            </p>

            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
              onClick={() => {
                if (currentIndex < files.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                }
              }}
              disabled={currentIndex >= files.length - 1}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="diff-block-container border rounded overflow-auto max-h-[600px]">
            {viewMode === "diff" ? (
              <div
                className="diff2html-wrapper"
                dangerouslySetInnerHTML={{
                  __html: html(currentFile.diff, {
                    outputFormat: "line-by-line",
                    drawFileList: false,
                    matching: "lines",
                  }),
                }}
              />
            ) : viewMode === "original" ? (
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
                {currentFile.originalCode.trim()}
              </SyntaxHighlighter>
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
                {currentFile.newCode.trim()}
              </SyntaxHighlighter>
            )}
          </div>

          <div className="flex justify-end items-center mt-6">
            <button
              className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => setShowFullScreen(false)}
            >
              Exit Detailed View
            </button>
          </div>
        </>
      )}
    </div>
  );
}
