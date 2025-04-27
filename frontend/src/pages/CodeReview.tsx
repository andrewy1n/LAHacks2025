import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { html } from "diff2html";
import { createTwoFilesPatch } from "diff";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAnalysis } from "../contexts/AnalysisContext";
import { useCodeChanges } from "../contexts/CodeChangesContext";
import "diff2html/bundles/css/diff2html.min.css";
import "../styles/CodeReview.css";

// Helper to decode \n
function decodeNewlines(text: string) {
  return text.replace(/\\n/g, "\n").replace(/\\"/g, '"');
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function CodeReviewPage() {
  const navigate = useNavigate();
  const { files, repoUrl } = useAnalysis();
  const { addFinalizedFile } = useCodeChanges();

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<"diff" | "original">("diff");

  const currentFile = files[currentFileIndex];

  useEffect(() => {
    if (!files || files.length === 0) {
      console.warn("No files to review!");
      navigate("/landing");
    }
  }, [files, navigate]);

  if (!currentFile) {
    return (
      <div className="code-review-page p-6 min-h-screen">
        <h1 className="text-2xl font-bold text-center">No files to review!</h1>
      </div>
    );
  }

  const diffString = createTwoFilesPatch(
    currentFile.filename,
    currentFile.filename,
    decodeNewlines(currentFile.original.trim()),
    decodeNewlines(currentFile.optimized.trim()),
    "",
    "",
    { context: 3 }
  );

  const saveFileToServer = async (filePath: string, content: string) => {
    try {
      const params = new URLSearchParams({
        file_path: filePath,
        content: content,
      });

      const response = await fetch(
        `${API_BASE_URL}save-file?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to save file");
      console.log(`✅ Saved ${filePath} successfully with query parameters`);
    } catch (err) {
      console.error("Error saving file:", err);
    }
  };

  const handleAcceptChanges = async () => {
    console.log(`Accepted changes for file: ${currentFile.filename}`);
    const optimizedContent = decodeNewlines(currentFile.optimized.trim());

    await saveFileToServer(currentFile.filename, optimizedContent);
    addFinalizedFile({
      filename: currentFile.filename,
      content: optimizedContent,
    });

    moveToNextFileOrFinish();
  };

  const handleDeclineChanges = async () => {
    console.log(`Kept original for file: ${currentFile.filename}`);
    const originalContent = decodeNewlines(currentFile.original.trim());

    await saveFileToServer(currentFile.filename, originalContent);
    addFinalizedFile({
      filename: currentFile.filename,
      content: originalContent,
    });

    moveToNextFileOrFinish();
  };

  const moveToNextFileOrFinish = () => {
    if (currentFileIndex + 1 < files.length) {
      setCurrentFileIndex((prev) => prev + 1);
      setShowFullScreen(false);
      setViewMode("diff");
    } else {
      setShowFullScreen(false);
      setViewMode("diff");
    }
  };

  const handleCreateBranch = async () => {
    try {
      const githubUrl = localStorage.getItem("github_repo_url");
      const installationId = 65359170;

      if (!githubUrl || !installationId) {
        alert("Missing GitHub URL or installation ID!");
        return;
      }

      const finalUrl = `${API_BASE_URL}create-branch?github_url=${encodeURIComponent(
        githubUrl
      )}&installation_id=${encodeURIComponent(installationId)}`;
      console.log("Calling create-branch with URL:", finalUrl);

      const response = await fetch(finalUrl, {
        method: "POST",
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error text:", errorText);
        throw new Error("Failed to create branch");
      }

      console.log("✅ Successfully created branch!");
      navigate("/branch-created-success"); // optional success page
    } catch (err) {
      console.error("Error creating branch:", err);
      alert("Failed to create branch. See console for more.");
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "diff" ? "original" : "diff"));
  };

  const handleDetailedChangesClick = () => {
    setShowFullScreen(true);
    setViewMode("diff");
  };

  const isLastFile = currentFileIndex === files.length - 1;

  return (
    <div className="code-review-page p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center flex-1">
          Reviewing {currentFile.filename}
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
          <div className="diff-block-container border rounded overflow-auto max-h-[600px] p-0">
            <div className="file-header bg-gray-100 text-gray-800 px-4 py-2 font-mono text-sm border-b">
              {currentFile.filename} [CHANGED]
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
              {decodeNewlines(currentFile.optimized.trim())}
            </SyntaxHighlighter>
          </div>

          <div className="flex justify-between items-center mt-6">
            {!isLastFile ? (
              <>
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
              </>
            ) : (
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded text-lg"
                onClick={handleCreateBranch}
              >
                Create Branch 🚀
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Detailed diff screen */}
          <div className="diff-block-container border rounded overflow-auto max-h-[600px]">
            <div className="file-header bg-gray-100 text-gray-800 px-4 py-2 font-mono text-sm border-b">
              {currentFile.filename}{" "}
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
                {decodeNewlines(currentFile.original.trim())}
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
