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
      <p>Commit to Cleaner Code.</p>
      <label>
        <button onClick={handleInstallApp} className="landing-button">
          Install GitHub App
        </button>
      </label>
    </div>
  );
}

export default Landing;
