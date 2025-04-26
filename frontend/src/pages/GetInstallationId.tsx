import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GetInstallationId() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const installationId = params.get("installation_id");

    if (installationId) {
      localStorage.setItem("installation_id", installationId);
      navigate("/gitlink");
    }
  }, [params, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Setting up GitHub App...</h1>
      <p>Redirecting...</p>
    </div>
  );
}
