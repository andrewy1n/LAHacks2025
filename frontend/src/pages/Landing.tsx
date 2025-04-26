import "./Landing.css";

function Landing() {
  return (
    <div className="body">
      <h1 className="title">RepoReleaf</h1>
      <p>
        Very cool description here that outlines the functionality and purpose
      </p>
      <label>
        Enter Github Repo Link:
        <input name="githuburl" />
        <button>Generate Report</button>
      </label>
    </div>
  );
}

export default Landing;
