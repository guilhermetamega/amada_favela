import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import RouteSkeleton from "@/components/ui/RouteSkeleton";
import AdminUserProfileHeader from "@/components/admin/users/AdminUserProfileHeader";
import AdminUserDetailTabs, {
  type AdminUserDetailTab,
} from "@/components/admin/users/AdminUserDetailsTabs";
import {
  getAdminUserDetail,
  listAdminUserAuditLogs,
  listAdminUserPayments,
} from "@/services/supabase/admin-user-detail";
import type {
  AdminUserAuditResponse,
  AdminUserDetailResponse,
  AdminUserPaymentsResponse,
} from "@/types/admin-user-detail";

export default function AdminUserDetailsPage() {
  const { userId } = useParams<{
    userId: string;
  }>();

  const [detail, setDetail] = useState<AdminUserDetailResponse | null>(null);

  const [activeTab, setActiveTab] = useState<AdminUserDetailTab>("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [payments, setPayments] = useState<AdminUserPaymentsResponse | null>(
    null,
  );

  const [paymentsPage, setPaymentsPage] = useState(1);

  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [paymentsError, setPaymentsError] = useState("");

  const [audit, setAudit] = useState<AdminUserAuditResponse | null>(null);

  const [auditPage, setAuditPage] = useState(1);

  const [auditLoading, setAuditLoading] = useState(false);

  const [auditError, setAuditError] = useState("");

  const detailRequestRef = useRef(0);
  const paymentsRequestRef = useRef(0);
  const auditRequestRef = useRef(0);

  const loadDetail = useCallback(
    async (manual = false) => {
      if (!userId) {
        setErrorMessage("Usuário não informado.");
        setLoading(false);
        return;
      }

      const requestId = ++detailRequestRef.current;

      try {
        if (manual || detail) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await getAdminUserDetail(userId);

        if (requestId !== detailRequestRef.current) {
          return;
        }

        setDetail(data);
      } catch (error) {
        if (requestId !== detailRequestRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o usuário.",
        );
      } finally {
        if (requestId === detailRequestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [detail, userId],
  );

  useEffect(() => {
    if (detail) return;

    void loadDetail();
  }, [detail, loadDetail]);

  useEffect(() => {
    if (activeTab !== "payments" || !userId) {
      return;
    }

    const requestId = ++paymentsRequestRef.current;

    async function loadPayments() {
      try {
        setPaymentsLoading(true);
        setPaymentsError("");

        const data = await listAdminUserPayments(userId, paymentsPage);

        if (requestId !== paymentsRequestRef.current) {
          return;
        }

        setPayments(data);
      } catch (error) {
        if (requestId !== paymentsRequestRef.current) {
          return;
        }

        setPaymentsError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os pagamentos.",
        );
      } finally {
        if (requestId === paymentsRequestRef.current) {
          setPaymentsLoading(false);
        }
      }
    }

    void loadPayments();
  }, [activeTab, paymentsPage, userId]);

  useEffect(() => {
    if (
      activeTab !== "audit" ||
      !userId ||
      !detail?.permissions.canViewSensitiveData
    ) {
      return;
    }

    const requestId = ++auditRequestRef.current;

    async function loadAudit() {
      try {
        setAuditLoading(true);
        setAuditError("");

        const data = await listAdminUserAuditLogs(userId, auditPage);

        if (requestId !== auditRequestRef.current) {
          return;
        }

        setAudit(data);
      } catch (error) {
        if (requestId !== auditRequestRef.current) {
          return;
        }

        setAuditError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a auditoria.",
        );
      } finally {
        if (requestId === auditRequestRef.current) {
          setAuditLoading(false);
        }
      }
    }

    void loadAudit();
  }, [activeTab, auditPage, detail?.permissions.canViewSensitiveData, userId]);

  function handleTabChange(tab: AdminUserDetailTab) {
    if (tab === "audit" && !detail?.permissions.canViewSensitiveData) {
      return;
    }

    setActiveTab(tab);
  }

  if (loading && !detail) {
    return <RouteSkeleton />;
  }

  if (!detail) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-3xl">
            <DashboardHeader title="Perfil administrativo" showBackButton />

            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage || "Usuário não encontrado."}
            </div>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex justify-between items-center w-full">
            <DashboardHeader title="Perfil administrativo" />
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void loadDetail(true)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Atualizar
            </button>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <AdminUserProfileHeader detail={detail} />

          <AdminUserDetailTabs
            activeTab={activeTab}
            detail={detail}
            payments={payments}
            paymentsLoading={paymentsLoading}
            paymentsError={paymentsError}
            onPaymentsPageChange={setPaymentsPage}
            audit={audit}
            auditLoading={auditLoading}
            auditError={auditError}
            onAuditPageChange={setAuditPage}
            onTabChange={handleTabChange}
          />
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
