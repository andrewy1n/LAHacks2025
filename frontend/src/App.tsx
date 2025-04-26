import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import TreeLoading from './pages/TreeLoading'
import CodeReview from './pages/CodeReview';
import Footprint from './pages/Footprint';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/treeloading" element={<TreeLoading />} /> 
        <Route path="/codereview" element={<CodeReview />} /> 
        <Route path="/footprint" element={<Footprint />} /> 
      </Routes>
    </BrowserRouter>    
  );
}

export default App
