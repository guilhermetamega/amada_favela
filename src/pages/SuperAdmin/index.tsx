import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Circle,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import {
  getAdminManageableUsers,
  getPlatformThirdPartyStripeStatus,
  openPlatformThirdPartyStripeAccount,
  updateUserRoleAsAdmin,
} from "@/services/supabase/admin";
import type {
  ManageableUser,
  PlatformThirdPartyStripeStatus,
  UserRole,
} from "@/types/admin";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";

function StripePartnerStatusBadge({
  status,
}: {
  status: PlatformThirdPartyStripeStatus | null;
}) {
  if (!status?.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
        <Clock3 size={13} />
        Não conectada
      </span>
    );
  }

  if (status.stripe_onboarding_completed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <CheckCircle2 size={13} />
        Conta ativa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
      <ShieldAlert size={13} />
      Cadastro pendente
    </span>
  );
}

function getStripePartnerButtonLabel(
  status: PlatformThirdPartyStripeStatus | null,
  loading: boolean,
) {
  if (loading) return "Abrindo Stripe...";
  if (!status?.connected) return "Conectar Stripe do sócio";
  if (status.stripe_onboarding_completed) return "Abrir painel Stripe";
  return "Continuar cadastro Stripe";
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [stripePartnerStatus, setStripePartnerStatus] =
    useState<PlatformThirdPartyStripeStatus | null>(null);
  const [loadingStripePartnerStatus, setLoadingStripePartnerStatus] =
    useState(true);
  const [openingStripePartner, setOpeningStripePartner] = useState(false);

  const stripePartnerButtonLabel = useMemo(
    () =>
      getStripePartnerButtonLabel(stripePartnerStatus, openingStripePartner),
    [stripePartnerStatus, openingStripePartner],
  );

  async function loadStripePartnerStatus() {
    try {
      setLoadingStripePartnerStatus(true);

      const status = await getPlatformThirdPartyStripeStatus();
      setStripePartnerStatus(status);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar status da Stripe do sócio.";

      setErrorMessage(message);
    } finally {
      setLoadingStripePartnerStatus(false);
    }
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const [usersData] = await Promise.all([
          getAdminManageableUsers(),
          loadStripePartnerStatus(),
        ]);

        setUsers(usersData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripePartnerReturn = params.get("stripe_partner");

    if (stripePartnerReturn === "return") {
      setSuccessMessage(
        "Retorno da Stripe recebido. Sincronizando status da conta do sócio...",
      );
      void loadStripePartnerStatus();
    }

    if (stripePartnerReturn === "refresh") {
      setSuccessMessage(
        "O link da Stripe expirou ou foi reaberto. Clique novamente para gerar um novo link.",
      );
      void loadStripePartnerStatus();
    }
  }, []);

  async function handleRoleChange(
    userId: string,
    newRole: "user" | "employee" | "president",
  ) {
    try {
      setUpdatingUserId(userId);
      setErrorMessage("");
      setSuccessMessage("");

      await updateUserRoleAsAdmin(userId, newRole);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole as UserRole } : user,
        ),
      );

      setSuccessMessage("Permissão atualizada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar role.";
      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleOpenStripePartner() {
    try {
      setOpeningStripePartner(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await openPlatformThirdPartyStripeAccount();
      setStripePartnerStatus(response);

      if (response.url) {
        window.location.assign(response.url);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao abrir a conta Stripe do sócio.";
      setErrorMessage(message);
    } finally {
      setOpeningStripePartner(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardHeader
            title="Super Admin"
            description="Gerencie usuários globais e contas integradas da plataforma."
          />

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                      <Circle size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Stripe do sócio
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Conta integrada que receberá a parte do parceiro nos
                        splits da plataforma.
                      </p>
                    </div>
                  </div>
                </div>

                <StripePartnerStatusBadge status={stripePartnerStatus} />
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3">
                {loadingStripePartnerStatus ? (
                  <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    <LoaderCircle size={16} className="animate-spin" />
                    Consultando status da conta Stripe...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Conta
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                          {stripePartnerStatus?.stripe_connected_account_id ??
                            "Não criada"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Onboarding
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {stripePartnerStatus?.stripe_onboarding_completed
                            ? "Concluído"
                            : "Pendente"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Saques
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {stripePartnerStatus?.payouts_enabled
                            ? "Ativos"
                            : "Inativos"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Associações
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {stripePartnerStatus?.mirrored_associations ?? 0}
                        </p>
                      </div>
                    </div>

                    {stripePartnerStatus?.requirements_currently_due?.length ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        <p className="font-semibold">
                          A Stripe ainda precisa de dados:
                        </p>
                        <p className="mt-1 wrap-break-word text-xs text-amber-100/80">
                          {stripePartnerStatus.requirements_currently_due.join(
                            ", ",
                          )}
                        </p>
                      </div>
                    ) : null}

                    {stripePartnerStatus?.stripe_onboarding_completed ? (
                      <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                        <p>
                          Conta liberada. O ID foi espelhado nas associações
                          ativas para habilitar o repasse de terceiro.
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleOpenStripePartner();
                }}
                disabled={openingStripePartner || loadingStripePartnerStatus}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/40 bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(139,92,246,0.22)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {openingStripePartner ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <ExternalLink size={16} />
                )}

                {stripePartnerButtonLabel}
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-300">
                <Users size={19} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Usuários globais
                </h2>
                <p className="text-sm text-zinc-400">
                  Gerencie roles de moradores, funcionários e presidentes.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-zinc-300">Carregando usuários...</div>
            ) : null}

            {!loading && users.length === 0 ? (
              <div className="p-6 text-zinc-300">
                Nenhum usuário disponível para gerenciamento.
              </div>
            ) : null}

            {!loading && users.length > 0 ? (
              <div className="grid grid-cols-1 divide-y divide-zinc-800">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {user.fullname}
                      </h3>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                      <p className="text-sm text-zinc-400">
                        Comunidade: {user.comunity || "Não informada"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          void handleRoleChange(
                            user.id,
                            event.target.value as
                              | "user"
                              | "employee"
                              | "president",
                          )
                        }
                        disabled={updatingUserId === user.id}
                        className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-zinc-500 disabled:opacity-60"
                      >
                        <option value="user">Usuário</option>
                        <option value="employee">Funcionário</option>
                        <option value="president">Presidente</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
