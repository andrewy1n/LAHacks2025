import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../contexts/AnalysisContext";

function GitLink() {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();
  const { setAnalysisData } = useAnalysis(); 

  const handleSubmitRepo = () => {
    if (!repoUrl) {
      alert("Please enter a GitHub repo URL!");
      return;
    }

    setAnalysisData({ repoUrl }); 
    navigate("/treeloading"); 
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

      <button className="landing-button mt-4" onClick={handleSubmitRepo}>
        Analyze Repo
      </button>
    </div>
  );
}

export default GitLink;

