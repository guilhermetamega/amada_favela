import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import RouteSkeleton from "@/components/ui/RouteSkeleton";
import PollsPage from "@/pages/Polls";
import AdminPollsPage from "@/pages/Admin/Polls";
import ServiceOrdersPage from "@/pages/ServiceOrders";
import AdminServiceOrdersPage from "@/pages/Admin/ServiceOrders";
import DeleteAccountPage from "@/pages/DeleteAccount";

const AuthPage = lazy(() => import("@/pages/Auth"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));

const LostAndFoundPage = lazy(() => import("@/pages/LostAndFound"));

const LostAnimalsPage = lazy(() => import("@/pages/LostAnimals"));

const HomeRentPage = lazy(() => import("@/pages/HomeRent"));

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

const PrivacyPolicyPage = lazy(() => import("@/pages/Legal/Privacy"));
const TermsOfUsePage = lazy(() => import("@/pages/Legal/Terms"));
const ChildPolicyPage = lazy(() => import("@/pages/Legal/ChildPolicy"));
const PaymentResultPage = lazy(() => import("@/pages/PaymentResult"));

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

          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfUsePage />} />
          <Route path="/child-policy" element={<ChildPolicyPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/lost-and-found" element={<LostAndFoundPage />} />

            <Route path="/lost-animals" element={<LostAnimalsPage />} />

            <Route path="/home-rent" element={<HomeRentPage />} />

            <Route path="/polls" element={<PollsPage />} />

            <Route path="/service-orders" element={<ServiceOrdersPage />} />

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
              element={
                <RoleGuard allowedRoles={["employee", "admin", "president"]} />
              }
            >
              <Route path="/admin" element={<AdminPage />} />

              <Route
                path="/admin/service-orders"
                element={<AdminServiceOrdersPage />}
              />
              <Route path="/admin/polls" element={<AdminPollsPage />} />
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
