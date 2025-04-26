import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import TreeLoading from './pages/TreeLoading'

function App() {
  return (
    <div>
      <div className="bg-red-500 text-white p-4">Hello Tailwind</div>
      <BrowserRouter>
        <Routes>
          <Route path="/treeloading" element={<TreeLoading />} /> 
        </Routes>
      </BrowserRouter>    
    </div>
  );
}
export default App
