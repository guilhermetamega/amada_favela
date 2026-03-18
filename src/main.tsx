import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/AppProviders";

function applySystemTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  document.documentElement.classList.toggle("dark", prefersDark);
}

// aplica na inicialização
applySystemTheme();

// reage a mudanças do sistema (IMPORTANTE)
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    document.documentElement.classList.toggle("dark", e.matches);
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
