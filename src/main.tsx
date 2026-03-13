import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProviders } from "@/providers/AppProviders";
import "@/styles/globals.css";
import { ProfileProvider } from "./contexts/ProfileContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </AppProviders>
  </React.StrictMode>,
);
