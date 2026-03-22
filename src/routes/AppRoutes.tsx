import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import LostAndFoundPage from "@/pages/LostAndFound";
import LostAndFoundDetailsPage from "@/pages/LostAndFound/LostAndFoundDetails";
import LostAnimalsDetailsPage from "@/pages/LostAnimals/LostAnimalsDeatils";
import LostAnimalsPage from "@/pages/LostAnimals";
import HomeRentDetailsPage from "@/pages/HomeRent/HomeRentDetails";
import HomeRentPage from "@/pages/HomeRent";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import AdminPage from "@/pages/Admin";
import SuperAdminPage from "@/pages/SuperAdmin";
import AdminMailPage from "@/pages/Admin/AdminMail";
import MailsPage from "@/pages/Mails";
import CreateWarningsPage from "@/pages/Admin/CreateWarnings";
import SocialProjectsPage from "@/pages/SocialProjects";
import SocialProjectsDetailsPage from "@/pages/SocialProjects/SocialProjectsDetails";
import AdminSocialProjectsPage from "@/pages/Admin/AdminSocialProjects";
import ProfilePage from "@/pages/Dashboard/Profile";
import WelcomeBannerPage from "@/pages/Dashboard/WelcomeBanner";
import MemberCardPage from "@/pages/MemberCard";
import ProofOfResidencePage from "@/pages/ProofOfResidence";
import ValidateProofPage from "@/pages/ValidateProof";

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

          <Route path="/dashboard/profile" element={<ProfilePage />} />

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

          <Route path="/dashboard/mails" element={<MailsPage />} />

          <Route path="/dashboard/member-card" element={<MemberCardPage />} />

          <Route
            path="/dashboard/proof-of-residence"
            element={<ProofOfResidencePage />}
          />
          <Route
            path="/validate-proof/:validationCode"
            element={<ValidateProofPage />}
          />

          <Route
            path="/dashboard/social-projects"
            element={<SocialProjectsPage />}
          />
          <Route
            path="/dashboard/social-projects/:id"
            element={<SocialProjectsDetailsPage />}
          />

          {/* {Guardião de rotas para segurança extra} */}
          <Route element={<RoleGuard allowedRoles={["admin", "president"]} />}>
            <Route path="/dashboard/admin" element={<AdminPage />} />
          </Route>

          <Route path="/dashboard/admin/mail" element={<AdminMailPage />} />

          <Route
            path="/dashboard/admin/create-warnings"
            element={<CreateWarningsPage />}
          />

          <Route
            path="/dashboard/admin/social-projects"
            element={<AdminSocialProjectsPage />}
          />

          <Route
            path="/dashboard/admin/welcome-banner"
            element={<WelcomeBannerPage />}
          />

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
