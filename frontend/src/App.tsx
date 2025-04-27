import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import TreeLoading from "./pages/TreeLoading";
import CodeReview from "./pages/CodeReview";
import Footprint from "./pages/Footprint";
import GitLink from "./pages/GitLink";
import SummaryReport from "./pages/SummaryReport";
import GetInstallationId from "./pages/GetInstallationId";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/treeloading" element={<TreeLoading />} />
        <Route path="/codereview" element={<CodeReview />} />
        <Route path="/footprint" element={<Footprint />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/gitlink" element={<GitLink />} />
        <Route path="/summary" element={<SummaryReport />} />
        <Route path="/github/setup" element={<GetInstallationId />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
