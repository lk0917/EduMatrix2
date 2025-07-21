// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/styles/global.css"; // 전역 스타일

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
