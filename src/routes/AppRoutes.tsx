import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import RouteSkeleton from "@/components/ui/RouteSkeleton";

const AuthPage = lazy(() => import("@/pages/Auth"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));

const LostAndFoundPage = lazy(() => import("@/pages/LostAndFound"));
const LostAndFoundDetailsPage = lazy(
  () => import("@/pages/LostAndFound/Details"),
);

const LostAnimalsPage = lazy(() => import("@/pages/LostAnimals"));
const LostAnimalsDetailsPage = lazy(
  () => import("@/pages/LostAnimals/Details"),
);

const HomeRentPage = lazy(() => import("@/pages/HomeRent"));
const HomeRentDetailsPage = lazy(() => import("@/pages/HomeRent/Details"));

const MailsPage = lazy(() => import("@/pages/Mails"));

const SocialProjectsPage = lazy(() => import("@/pages/SocialProjects"));
const SocialProjectsDetailsPage = lazy(
  () => import("@/pages/SocialProjects/Details"),
);

const ProfilePage = lazy(() => import("@/pages/Dashboard/Profile"));
const MemberCardPage = lazy(() => import("@/pages/MemberCard"));
const ProofOfResidencePage = lazy(() => import("@/pages/ProofOfResidence"));
const ValidateProofPage = lazy(() => import("@/pages/ValidateProof"));

const AdminPage = lazy(() => import("@/pages/Admin"));
const SuperAdminPage = lazy(() => import("@/pages/SuperAdmin"));
const AdminMailPage = lazy(() => import("@/pages/Admin/Mail"));
const CreateWarningsPage = lazy(() => import("@/pages/Admin/CreateWarnings"));
const AdminSocialProjectsPage = lazy(
  () => import("@/pages/Admin/SocialProjects"),
);
const WelcomeBannerPage = lazy(() => import("@/pages/Dashboard/WelcomeBanner"));
const AssociationSettingsPage = lazy(() => import("@/pages/Admin/Association"));

const NotFoundPage = lazy(() => import("@/pages/NotFound"));

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/lost-and-found" element={<LostAndFoundPage />} />
            <Route
              path="/lost-and-found/:id"
              element={<LostAndFoundDetailsPage />}
            />

            <Route path="/lost-animals" element={<LostAnimalsPage />} />
            <Route
              path="/lost-animals/:id"
              element={<LostAnimalsDetailsPage />}
            />

            <Route path="/home-rent" element={<HomeRentPage />} />
            <Route path="/home-rent/:id" element={<HomeRentDetailsPage />} />

            <Route path="/mails" element={<MailsPage />} />
            <Route path="/member-card" element={<MemberCardPage />} />
            <Route
              path="/proof-of-residence"
              element={<ProofOfResidencePage />}
            />

            <Route path="/social-projects" element={<SocialProjectsPage />} />
            <Route
              path="/social-projects/:id"
              element={<SocialProjectsDetailsPage />}
            />

            <Route
              element={<RoleGuard allowedRoles={["admin", "president"]} />}
            >
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/mail" element={<AdminMailPage />} />
              <Route
                path="/admin/association"
                element={<AssociationSettingsPage />}
              />
              <Route
                path="/admin/create-warnings"
                element={<CreateWarningsPage />}
              />
              <Route
                path="/admin/social-projects"
                element={<AdminSocialProjectsPage />}
              />
              <Route
                path="/admin/welcome-banner"
                element={<WelcomeBannerPage />}
              />
            </Route>

            <Route element={<RoleGuard allowedRoles={["admin"]} />}>
              <Route path="/super-admin" element={<SuperAdminPage />} />
            </Route>
          </Route>

          <Route
            path="/validate-proof/:validationCode"
            element={<ValidateProofPage />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
