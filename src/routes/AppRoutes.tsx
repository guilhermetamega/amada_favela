import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import RequiredPasswordChangeGuard from "./RequiredPasswordChangeGuard";
import RouteSkeleton from "@/components/ui/RouteSkeleton";
import PollsPage from "@/pages/Polls";
import AdminPollsPage from "@/pages/Admin/Polls";
import ServiceOrdersPage from "@/pages/ServiceOrders";
import AdminServiceOrdersPage from "@/pages/Admin/ServiceOrders";
import DeleteAccountPage from "@/pages/DeleteAccount";
import SponsorLoginPage from "@/pages/Sponsor/Login";
import SponsorSessionGuard from "./SponsorSessionGuard";
import SponsorHomePage from "@/pages/Sponsor";
import SponsorWeeklyAdPage from "@/pages/Sponsor/WeeklyAd";
import SponsorBannerPage from "@/pages/Sponsor/Banner";
import SponsorRafflesPage from "@/pages/Sponsor/Raffles";
import PublicRafflePage from "@/pages/Raffles/PublicRaffle";
import BingoPage from "@/pages/Bingo";
import AdminBingoPage from "@/pages/Admin/Bingo";

const GarbageSchedulesPublicPage = lazy(
  () => import("@/pages/GarbageSchedules"),
);

const AuthPage = lazy(() => import("@/pages/Auth"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));

const RequiredPasswordChangePage = lazy(
  () => import("@/pages/Security/RequiredPasswordChange"),
);

const MercadoPagoOAuthCallbackPage = lazy(
  () => import("@/pages/MercadoPagoOAuthCallback"),
);

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

const ResumeBuilderPage = lazy(() => import("@/pages/ResumeBuilder"));

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

const GarbageSchedulesPage = lazy(
  () => import("@/pages/Admin/GarbageSchedules"),
);

const NotFoundPage = lazy(() => import("@/pages/NotFound"));

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/sponsor/login" element={<SponsorLoginPage />} />

          <Route path="/sponsor/login/" element={<SponsorLoginPage />} />

          <Route element={<SponsorSessionGuard />}>
            <Route path="/sponsor" element={<SponsorHomePage />} />

            <Route path="/sponsor/" element={<SponsorHomePage />} />

            <Route
              path="/sponsor/weekly-ad"
              element={<SponsorWeeklyAdPage />}
            />

            <Route path="/sponsor/banner" element={<SponsorBannerPage />} />

            <Route path="/sponsor/raffles" element={<SponsorRafflesPage />} />
          </Route>

          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          <Route path="/terms" element={<TermsOfUsePage />} />

          <Route path="/child-policy" element={<ChildPolicyPage />} />

          <Route path="/delete-account" element={<DeleteAccountPage />} />

          <Route path="/payment/result" element={<PaymentResultPage />} />

          <Route
            path="/payments/mercadopago/oauth/callback"
            element={<MercadoPagoOAuthCallbackPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/security/change-password"
              element={<RequiredPasswordChangePage />}
            />

            <Route element={<RequiredPasswordChangeGuard />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/lost-and-found" element={<LostAndFoundPage />} />

              <Route path="/missing" element={<LostAnimalsPage />} />

              <Route path="/home-rent" element={<HomeRentPage />} />

              <Route path="/polls" element={<PollsPage />} />

              <Route path="/bingo" element={<BingoPage />} />

              <Route path="/service-orders" element={<ServiceOrdersPage />} />

              <Route path="/mails" element={<MailsPage />} />

              <Route path="/member-card" element={<MemberCardPage />} />

              <Route
                path="/proof-of-residence"
                element={<ProofOfResidencePage />}
              />

              <Route path="/resume-builder" element={<ResumeBuilderPage />} />

              <Route path="/social-projects" element={<SocialProjectsPage />} />

              <Route
                path="/garbage-schedules"
                element={<GarbageSchedulesPublicPage />}
              />

              <Route
                path="/social-projects/:id"
                element={<SocialProjectsDetailsPage />}
              />

              <Route
                element={
                  <RoleGuard
                    allowedRoles={["employee", "admin", "president"]}
                  />
                }
              >
                <Route path="/admin" element={<AdminPage />} />

                <Route
                  path="/admin/service-orders"
                  element={<AdminServiceOrdersPage />}
                />

                <Route path="/admin/polls" element={<AdminPollsPage />} />

                <Route path="/admin/bingo" element={<AdminBingoPage />} />

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

                <Route
                  path="/admin/association/garbage-schedules"
                  element={<GarbageSchedulesPage />}
                />
              </Route>

              <Route element={<RoleGuard allowedRoles={["admin"]} />}>
                <Route path="/super-admin" element={<SuperAdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route
            path="/validate-proof/:validationCode"
            element={<ValidateProofPage />}
          />

          <Route path="/raffles/:slug" element={<PublicRafflePage />} />

          <Route path="/sponsor/*" element={<NotFoundPage />} />

          <Route path="/raffles/*" element={<NotFoundPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
