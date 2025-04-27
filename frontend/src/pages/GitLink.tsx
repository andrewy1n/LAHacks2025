import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventSourcePolyfill } from 'event-source-polyfill';

function GitLink() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const navigate = useNavigate();

  const handleGenerateReport = () => {
    if (!repoUrl) {
      alert("Please enter a GitHub repo URL!");
      return;
    }

    localStorage.setItem("github_repo_url", repoUrl);
    setIsAnalyzing(true);

    const baseUrl = import.meta.env.VITE_API_URL; // No modification here!
    const fullUrl = `${baseUrl}analyze?github_url=${encodeURIComponent(repoUrl)}`;

    console.log("Connecting to EventSource URL:", fullUrl);
    
    const eventSource = new EventSourcePolyfill(fullUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    let issues: any[] = [];
    let metrics: any = null;
    let carbon: null = null;
    let files: any[] = [];

    eventSource.onmessage = (event) => {
      const data = event.data;
      console.log("[SSE]", data);

      if (data.startsWith("carbon_per_view:")) {
        carbon = data.replace("carbon_per_view:", "").trim();
      } else if (data.startsWith("issue:")) {
        const issue = JSON.parse(data.replace("issue:", "").trim());
        issues.push(issue);
      } else if (data.startsWith("metrics:")) {
        metrics = JSON.parse(data.replace("metrics:", "").trim());
      } else if (data.startsWith("path:")) {
        const filename = data.replace("path:", "").trim();
        files.push({ filename, original: "", optimized: "" });
      } else if (data.startsWith("original:")) {
        const lastFile = files[files.length - 1];
        if (lastFile) lastFile.original = data.replace("original:", "").trim();
      } else if (data.startsWith("optimized:")) {
        const lastFile = files[files.length - 1];
        if (lastFile) lastFile.optimized = data.replace("optimized:", "").trim();
      } else if (data.includes("🎉 All done")) {
        eventSource.close();

        localStorage.setItem("analysis_issues", JSON.stringify(issues));
        localStorage.setItem("analysis_metrics", JSON.stringify(metrics));
        localStorage.setItem("analysis_carbon", JSON.stringify(carbon));
        localStorage.setItem("analysis_files", JSON.stringify(files));

        setAnalysisComplete(true);
        setIsAnalyzing(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      eventSource.close();
      setIsAnalyzing(false);
    };
  };

  const handleViewResults = () => {

  };

  return (
    <div className="landing-body">
      <h1>RepoReleaf</h1>
      <label>
        GitHub Repository URL:
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/reponame"
          className="input-box"
        />
      </label>

      <button className="landing-button mt-4" onClick={handleGenerateReport} disabled={isAnalyzing}>
        {isAnalyzing ? "Analyzing..." : "Generate Report"}
      </button>

      {analysisComplete && (
        <button className="landing-button mt-4" onClick={handleViewResults}>
          View Results
        </button>
      )}
    </div>
  );
}

export default GitLink;


