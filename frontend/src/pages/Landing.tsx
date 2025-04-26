import "../styles/Landing.css";

function Landing() {
  return (
    <div className="landing-body">
      <h1 className="landing-title">RepoReleaf</h1>
      <p>
        Very cool description here that outlines the functionality and purpose
      </p>
      <label>
        Enter Github Repo Link:
        <input name="githuburl" />
        <button className="landing-button">Generate Report</button>
      </label>
    </div>
  );
}

export default Landing;
