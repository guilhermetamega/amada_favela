import { memo, useMemo } from "react";
import { Clock3, CreditCard, LoaderCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppRouteConfig } from "@/routes/route-config";
import NavigationButton from "@/components/ui/NavigationButton";
import { getNavigationButtonTheme } from "@/lib/navigation-button-theme";
import AssociationWhatsAppButton from "@/components/dashboard/AssociationWhatsappButton";
import LojasDasComunidadesButton from "@/components/dashboard/LojasDasComunidadesButton";
import type { OpenMembershipPayment } from "@/types/membership";

type Props = {
  routes: AppRouteConfig[];
  hasActivePartner: boolean;
  payingMonthlyFee: boolean;
  hasOpenMembershipPayment: boolean;
  openMembershipPaymentStatus: OpenMembershipPayment["status"] | null;
  loadingOpenMembershipPayment: boolean;
  onPayMonthlyFeeClick: () => void;
};

function DashboardRouteGrid({ routes }: { routes: AppRouteConfig[] }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {routes.map((route) => (
        <NavigationButton
          key={route.path}
          label={route.label}
          description={route.description}
          icon={route.icon}
          onClick={() => navigate(route.path)}
          color={getNavigationButtonTheme(route.colorClass)}
        />
      ))}
    </div>
  );
}

function DashboardModuleGridComponent({
  routes,
  hasActivePartner,
  payingMonthlyFee,
  hasOpenMembershipPayment,
  openMembershipPaymentStatus,
  loadingOpenMembershipPayment,
  onPayMonthlyFeeClick,
}: Props) {
  const premiumRoutes = useMemo(
    () => routes.filter((route) => route.isPremium),
    [routes],
  );

  const standardRoutes = useMemo(
    () => routes.filter((route) => !route.isPremium),
    [routes],
  );

  const shouldHighlightPremium = premiumRoutes.length > 0 && !hasActivePartner;

  const payDisabled =
    hasActivePartner ||
    payingMonthlyFee ||
    hasOpenMembershipPayment ||
    loadingOpenMembershipPayment;

  const buttonLabel = payingMonthlyFee
    ? "Abrindo checkout..."
    : hasOpenMembershipPayment
      ? "Processando pagamento"
      : "Quero Virar Sócio";

  const helperLabel = hasOpenMembershipPayment
    ? openMembershipPaymentStatus === "requires_action"
      ? "Existe uma cobrança que ainda requer ação ou confirmação."
      : "Existe uma cobrança em aberto. Aguarde a confirmação antes de tentar novamente."
    : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {premiumRoutes.length > 0 ? (
        <section
          className={`relative overflow-hidden rounded-[28px] border p-4 sm:p-5 ${
            shouldHighlightPremium
              ? "border-amber-300/70 bg-linear-to-br from-amber-50/90 via-white to-yellow-50/80 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_0_24px_rgba(251,191,36,0.08)] dark:border-amber-400/20 dark:from-amber-400/8 dark:via-zinc-950 dark:to-amber-300/6 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_0_24px_rgba(251,191,36,0.05)]"
              : "border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95"
          }`}
        >
          <span
            className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              shouldHighlightPremium
                ? "bg-amber-100/90 text-amber-800 shadow-[0_0_18px_rgba(251,191,36,0.14)] dark:bg-amber-400/10 dark:text-amber-200"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {shouldHighlightPremium ? (
              <Sparkles size={13} className="animate-pulse" />
            ) : null}
            Premium
          </span>

          {shouldHighlightPremium ? (
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-amber-300 to-transparent opacity-90 blur-[1px] dark:via-amber-200/70" />
          ) : null}

          <div className="space-y-4">
            <DashboardRouteGrid routes={premiumRoutes} />

            {!hasActivePartner ? (
              <div className="">
                <button
                  type="button"
                  onClick={onPayMonthlyFeeClick}
                  disabled={payDisabled}
                  className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 sm:min-w-55 sm:w-auto ${
                    payDisabled
                      ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                      : "border border-amber-300/80 bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300 text-amber-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(251,191,36,0.28)] dark:border-amber-300/20 dark:from-amber-300 dark:via-yellow-200 dark:to-orange-200 dark:text-amber-950"
                  }`}
                >
                  {!payDisabled ? (
                    <>
                      <span className="pointer-events-none absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-white/25 blur-md transition-transform duration-700 group-hover:translate-x-[330%]" />
                      <span className="pointer-events-none absolute right-3 top-2 text-amber-800/80">
                        <Sparkles size={12} className="animate-pulse" />
                      </span>
                    </>
                  ) : null}

                  {payingMonthlyFee ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : hasOpenMembershipPayment ? (
                    <Clock3 size={16} />
                  ) : (
                    <CreditCard size={16} />
                  )}

                  {buttonLabel}
                </button>

                {helperLabel ? (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {helperLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={`space-y-3 pt-1`}>
        {standardRoutes.length > 0 ? (
          <DashboardRouteGrid routes={standardRoutes} />
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
          <AssociationWhatsAppButton />
          <LojasDasComunidadesButton />
        </div>
      </section>
    </div>
  );
}

const DashboardModuleGrid = memo(DashboardModuleGridComponent);
export default DashboardModuleGrid;
