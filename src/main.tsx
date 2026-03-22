import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/AppProviders";

window.addEventListener("error", (event) => {
  const pre = document.createElement("pre");
  pre.style.position = "fixed";
  pre.style.inset = "0";
  pre.style.zIndex = "999999";
  pre.style.background = "#111";
  pre.style.color = "#ff6b6b";
  pre.style.padding = "16px";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.overflow = "auto";
  pre.textContent = `Erro JS:\n${event.message}\n\n${event.error?.stack ?? ""}`;
  document.body.appendChild(pre);
});

window.addEventListener("unhandledrejection", (event) => {
  const pre = document.createElement("pre");
  pre.style.position = "fixed";
  pre.style.inset = "0";
  pre.style.zIndex = "999999";
  pre.style.background = "#111";
  pre.style.color = "#ffd166";
  pre.style.padding = "16px";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.overflow = "auto";
  pre.textContent = `Promise rejeitada:\n${String(event.reason?.message ?? event.reason)}\n\n${String(event.reason?.stack ?? "")}`;
  document.body.appendChild(pre);
});

function applySystemTheme() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  document.documentElement.classList.toggle("dark", mediaQuery.matches);
}

function listenSystemThemeChanges() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (event: MediaQueryListEvent | MediaQueryList) => {
    document.documentElement.classList.toggle("dark", event.matches);
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handler);
  }
}

applySystemTheme();
listenSystemThemeChanges();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
