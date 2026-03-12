import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "@/pages/Auth";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}
