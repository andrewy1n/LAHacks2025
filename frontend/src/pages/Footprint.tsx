import React, { useEffect } from "react";
import { useConfetti } from "use-confetti-svg";
import "./Footprint.css";
import deadleaf from "../assets/Leaf.svg";

function Footprint() {
  const carbonemission = 0.12; // temp hardcoded. we will get this value from the backend

  const [, setAnimating] = React.useState(false);

  const { runAnimation } = useConfetti({
    images: [
      {
        src: deadleaf,
        size: 50,
        weight: 5,
      },
    ],
    duration: 6500,
    fadeOut: false,
    particleCount: carbonemission * 100, // this value changes based on our carbon footprint
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
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="body"></div>;
}

export default Footprint;
