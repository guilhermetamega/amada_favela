import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { loadCommunitiesFromSupabase } from "@/lib/communities";

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

async function bootstrap() {
  applySystemTheme();
  listenSystemThemeChanges();
  await loadCommunitiesFromSupabase();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>,
  );
}

void bootstrap();
