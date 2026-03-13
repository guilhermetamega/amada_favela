import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import LostAndFoundPage from "@/pages/LostAndFound";
import LostAndFoundDetailsPage from "@/pages/LostAndFoundDetails";
import LostAnimalsDetailsPage from "@/pages/LostAnimalsDeatils";
import LostAnimalsPage from "@/pages/LostAnimals";
import HomeRentDetailsPage from "@/pages/HomeRentDetails";
import HomeRentPage from "@/pages/HomeRent";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/dashboard/lost-and-found"
          element={<LostAndFoundPage />}
        />
        <Route
          path="/dashboard/lost-and-found/:id"
          element={<LostAndFoundDetailsPage />}
        />

        <Route path="/dashboard/lost-animals" element={<LostAnimalsPage />} />
        <Route
          path="/dashboard/lost-animals/:id"
          element={<LostAnimalsDetailsPage />}
        />

        <Route path="/dashboard/home-rent" element={<HomeRentPage />} />
        <Route
          path="/dashboard/home-rent/:id"
          element={<HomeRentDetailsPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
