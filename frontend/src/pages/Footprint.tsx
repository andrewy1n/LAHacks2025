import { useEffect, useState } from "react";
import { useConfetti } from "use-confetti-svg";
import "../styles/Footprint.css";
import deadleaf from "../assets/Leaf.svg";
import { PieChart } from "@mui/x-charts/PieChart";
import { legendClasses } from "@mui/x-charts/ChartsLegend";
import { useAnalysis } from "../contexts/AnalysisContext";
import { useNavigate } from "react-router-dom";

function Footprint() {
  const { carbon, metrics } = useAnalysis();
  const [carbonemission, setCarbonemission] = useState<number>(0);
  const [imagebytes, setimagebytes] = useState<number>(0);
  const [codebytes, setcodebytes] = useState<number>(0);
  const [, setAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!metrics) return;
    setCarbonemission(carbon ?? 0);
    setimagebytes(metrics.image_bytes ?? 0);
    setcodebytes(metrics.code_bytes ?? 0);

    localStorage.setItem("carbon_emission_old", (carbon ?? 0).toString());
    localStorage.setItem(
      "total_bytes_old",
      ((metrics.image_bytes ?? 0) + (metrics.code_bytes ?? 0)).toString()
    );
  }, [carbon, metrics]);

  const { runAnimation } = useConfetti({
    images: [{ src: deadleaf, size: 50 }],
    duration: 6500,
    // fadeOut: true,
    rotate: true,
    particleCount: carbonemission ? carbonemission * 100 : 30,
  });

  useEffect(() => {
    if (!carbonemission) return;

    const timer = setTimeout(() => {
      setAnimating(true);
      runAnimation().then(() => {
        setAnimating(false);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [carbonemission]);

  if (!metrics || carbon === null || carbon === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="footprint-body">
      <h1 className="footprint-title">Carbon Footprint Report</h1>
      <div className="content-container">
        <PieChart
          series={[
            {
              data: [
                { id: 0, value: imagebytes, label: "Image bytes" },
                { id: 1, value: codebytes, label: "Code bytes" },
              ],
              innerRadius: 30,
              outerRadius: 150,
              paddingAngle: 2,
              cornerRadius: 2,
            },
          ]}
          slotProps={{
            legend: {
              sx: {
                gap: "16px",
                [`.${legendClasses.mark}`]: {
                  height: 31,
                  width: 31,
                },
                fontSize: 20,
              },
            },
          }}
          width={350}
          height={350}
        />

        <div className="info-card">
          <h2>Page Emissions</h2>
          <p className="emissions-value">{carbonemission.toFixed(3)} g</p>
          <p className="emissions-description">
            For every <b>1,000</b> pageviews, you’re emitting{" "}
            <b>{Math.round(carbonemission * 1000)} grams</b> of carbon dioxide.
          </p>
        </div>
      </div>

      <button
        className="footprint-button"
        onClick={() => navigate("/CodeReview")}
      >
        Decrease Footprint!
      </button>
    </div>
  );
}

export default Footprint;
