import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from '@vercel/analytics/react'
import App from "./App.jsx";
import Legal from "./Legal.jsx";
import "./index.css";

// Roteamento mínimo, sem biblioteca: só há duas páginas extras.
function Root() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/privacidade") return <Legal doc="privacidade" />;
  if (path === "/termos") return <Legal doc="termos" />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
    <Analytics />
  </React.StrictMode>
);
