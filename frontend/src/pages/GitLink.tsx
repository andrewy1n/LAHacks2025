import "../styles/Landing.css";

function GitLink() {
  return (
    <div className="landing-body">
      <h1 className="landing-title">RepoReleaf</h1>
      <p>
        Now that you have installed the github app, please input your github
        repo link.
      </p>
      <label>
        Enter Github Repo Link:
        <input name="githuburl" />
        <button className="landing-button">Generate Report</button>
      </label>
    </div>
  );
}

export default GitLink;
