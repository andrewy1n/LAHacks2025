import { useEffect, useState } from "react";
import { useConfetti } from "use-confetti-svg";
import "../styles/Footprint.css";
import deadleaf from "../assets/Leaf.svg";
import { PieChart } from "@mui/x-charts/PieChart";

function Footprint() {
  const [data, setData] = useState<any>(null);
  const [carbonemission, setCarbonemission] = useState<number | null>(null);
  const [, setAnimating] = useState(false);

  useEffect(() => {
    const hardcodedData = {
      metrics: {
        total_bytes: 3425126,
        image_bytes: 3404175,
        code_bytes: 20951,
      },
      issues: [
        {
          type: "UnminifiedAsset",
          file: "client/app/globals.css",
          explanation:
            "Refer to sustainable web design guidelines to address this issue.",
        },
      ],
      carbon: {
        carbon_per_view: 0.3057069846764207,
        notes: "0.31 g CO₂ per view",
      },
    };
    setData(hardcodedData);
    setCarbonemission(hardcodedData.carbon.carbon_per_view);
  }, []);

  const { runAnimation } = useConfetti({
    images: [{ src: deadleaf, size: 50 }],
    duration: 6500,
    fadeOut: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carbonemission]);

  if (!data || carbonemission === null) {
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
                { id: 0, value: 10, label: "stuff 1" },
                { id: 1, value: 15, label: "stuff 2" },
                { id: 2, value: 20, label: "stuff 3" },
              ],
              innerRadius: 30,
              outerRadius: 150,
              paddingAngle: 2,
              cornerRadius: 2,
            },
          ]}
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

      <button className="footprint-button">Decrease Footprint!</button>
    </div>
  );
}

export default Footprint;
