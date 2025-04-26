import React, { useEffect } from "react";
import { useConfetti } from "use-confetti-svg";
import "../styles/Footprint.css";
import deadleaf from "../assets/Leaf.svg";
import { PieChart } from "@mui/x-charts/PieChart";

function Footprint() {
  const carbonemission = 0.12; // temp hardcoded. we will get this value from the backend
  const particleNum = carbonemission * 100;

  const [, setAnimating] = React.useState(false);

  const { runAnimation } = useConfetti({
    images: [
      {
        src: deadleaf,
        size: 50,
      },
    ],
    duration: 6500,
    fadeOut: false,
    particleCount: particleNum, // this value changes based on our carbon footprint
    rotate: true,
  });

  const handleRunAnimation = () => {
    setAnimating(true);
    runAnimation().then(() => {
      setAnimating(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRunAnimation();
    }, 150);

    return () => clearTimeout(timer);
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <p className="emissions-value">{carbonemission} g</p>
          <p className="emissions-description">
            For every <b>1,000</b> pageviews, you’re emitting{" "}
            <b>{carbonemission * 1000} grams</b> of carbon dioxide.
          </p>
        </div>
      </div>
      <button className="footprint-button">Decrease Footprint!</button>
    </div>
  );
}

export default Footprint;
