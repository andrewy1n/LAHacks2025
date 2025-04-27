import { useEffect, useState } from "react";
import "../styles/Summary.css";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

type EmissionsProps = {
  oldCarbon: number;
  newCarbon: number;
};

type WeightsProps = {
  oldsize: number;
  totalbytes: number;
};

function Emissions({ oldCarbon, newCarbon }: EmissionsProps) {
  const [options] = useState<AgChartOptions>({
    data: [
      {
        quarter: "Carbon Footprint",
        before: oldCarbon,
        after: newCarbon,
      },
    ],
    series: [
      { type: "bar", xKey: "quarter", yKey: "before", yName: "before" },
      { type: "bar", xKey: "quarter", yKey: "after", yName: "after" },
    ],
  });

  return <AgCharts options={options} />;
}

function Weight({ oldsize, totalbytes }: WeightsProps) {
  const [options] = useState<AgChartOptions>({
    data: [
      {
        quarter: "Page Weight",
        before: oldsize,
        after: totalbytes,
      },
    ],
    series: [
      { type: "bar", xKey: "quarter", yKey: "before", yName: "before" },
      { type: "bar", xKey: "quarter", yKey: "after", yName: "after" },
    ],
  });

  return <AgCharts options={options} />;
}

function SummaryReport() {
  const [, setData] = useState<any>(null);
  const [carbonemission, setCarbonemission] = useState<number>(0);
  const [totalbytes, setTotalbytes] = useState<number>(0);

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
    setTotalbytes(hardcodedData.metrics.total_bytes);
  }, []);

  const oldcarbon = parseFloat(
    localStorage.getItem("carbon_emission_old") || "0"
  );

  const oldsize = parseInt(localStorage.getItem("total_bytes_old") || "0", 10);

  if (!carbonemission || !oldcarbon) {
    return <div>Loading...</div>;
  }

  return (
    <div className="summary-body">
      <h1 className="footprint-title">Before and After</h1>
      <div className="content-container">
        <div className="info-card">
          <h2>Page Emissions</h2>
          <p className="emissions-value">
            {oldcarbon.toFixed(2)} to {carbonemission.toFixed(2)} g
          </p>
          <p className="emissions-description">
            That's <b>{carbonemission / oldcarbon} % </b>less carbon dioxide!
          </p>
        </div>
        <Emissions oldCarbon={oldcarbon} newCarbon={carbonemission} />
        <div className="info-card">
          <h2>Page Weight</h2>
          <p className="emissions-value">
            {oldsize} to {totalbytes} bytes
          </p>
          <p className="emissions-description">
            That's <b>{totalbytes / oldsize} % </b>smaller!
          </p>
        </div>
        <Weight oldsize={oldsize} totalbytes={totalbytes} />
      </div>

      <button className="summary-button">Solidify Changes!</button>
    </div>
  );
}

export default SummaryReport;
