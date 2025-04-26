import "../styles/Landing.css";

function Landing() {
  const handleInstallApp = () => {
    const installUrl = `https://github.com/apps/${
      import.meta.env.VITE_APP_SLUG
    }/installations/new`;
    window.location.href = installUrl;
  };

  return (
    <div className="landing-body">
      <h1 className="landing-title">RepoReleaf</h1>
      <p>
        Very cool description here that outlines the functionality and purpose
      </p>
      <label>
        <button onClick={handleInstallApp} className="landing-button">
          Install GitHub App
        </button>
        Enter Github Repo Link:
        <input name="githuburl" />
        <button className="landing-button">Generate Report</button>
      </label>
    </div>
  );
}

export default Landing;
