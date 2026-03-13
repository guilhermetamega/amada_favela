import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import LostAndFoundPage from "@/pages/LostAndFound";
import LostAndFoundDetailsPage from "@/pages/LostAndFoundDetails";
import LostAnimalsDetailsPage from "@/pages/LostAnimalsDeatils";
import LostAnimalsPage from "@/pages/LostAnimals";
import HomeRentDetailsPage from "@/pages/HomeRentDetails";
import HomeRentPage from "@/pages/HomeRent";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import AdminPage from "@/pages/Admin";
import SuperAdminPage from "@/pages/SuperAdmin";
import AdminMailPage from "@/pages/Mail";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* {Rotas necessárias ter feito autenticação para acessar} */}
        <Route element={<ProtectedRoute />}>
          {/* {Rotas padrão} */}
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
          {/* {Guardião de rotas para segurança extra} */}
          <Route element={<RoleGuard allowedRoles={["admin", "president"]} />}>
            <Route path="/dashboard/admin" element={<AdminPage />} />
          </Route>

          <Route path="/dashboard/admin/mail" element={<AdminMailPage />} />

          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route path="/dashboard/super-admin" element={<SuperAdminPage />} />
          </Route>

          <Route
            element={
              <RoleGuard
                allowedRoles={["admin", "president", "employee", "user"]}
                requirePartner
              />
            }
          ></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
