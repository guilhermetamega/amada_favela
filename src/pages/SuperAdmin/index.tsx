import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Circle,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import {
  createCommunityAsAdmin,
  getAdminManageableUsers,
  listCommunitiesAsAdmin,
  getPlatformThirdPartyStripeStatus,
  openPlatformThirdPartyStripeAccount,
  updateCommunityAsAdmin,
  updateUserRoleAsAdmin,
} from "@/services/supabase/admin";
import type {
  ManageableUser,
  PlatformThirdPartyStripeStatus,
  UserRole,
} from "@/types/admin";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import type { CommunityAddressItem, CommunityData } from "@/types/community";

const ADDRESS_TYPE_OPTIONS = [
  { value: "street", label: "Street (Rua)" },
  { value: "block", label: "Block (Quadra)" },
  { value: "lane", label: "Lane (Travessa)" },
  { value: "village", label: "Village (Vila)" },
  { value: "building", label: "Building (Prédio)" },
  { value: "others", label: "Others (Outros)" },
] as const;

function createEmptyAddressItem(): CommunityAddressItem {
  return {
    type: "street",
    label: "",
    value: "",
    address_number: "",
  };
}

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
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [editingCommunityKey, setEditingCommunityKey] = useState<string | null>(
    null,
  );
  const [communityForm, setCommunityForm] = useState<CommunityData>({
    key: "",
    label: "",
    active: true,
    zipcodes: [],
    addressItems: [],
  });
  const [zipcodesText, setZipcodesText] = useState("");
  const [addressItemsForm, setAddressItemsForm] = useState<CommunityAddressItem[]>([
    createEmptyAddressItem(),
  ]);

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
          loadCommunities(),
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

  async function loadCommunities() {
    try {
      setLoadingCommunities(true);
      const data = await listCommunitiesAsAdmin();
      setCommunities(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar comunidades.";
      setErrorMessage(message);
    } finally {
      setLoadingCommunities(false);
    }
  }

  function openCreateCommunityModal() {
    setEditingCommunityKey(null);
    setCommunityForm({
      key: "",
      label: "",
      active: true,
      zipcodes: [],
      addressItems: [],
    });
    setZipcodesText("");
    setAddressItemsForm([createEmptyAddressItem()]);
    setShowCommunityModal(true);
  }

  function openEditCommunityModal(item: CommunityData) {
    setEditingCommunityKey(item.key);
    setCommunityForm(item);
    setZipcodesText(item.zipcodes.join("\n"));
    setAddressItemsForm(
      item.addressItems.length ? item.addressItems : [createEmptyAddressItem()],
    );
    setShowCommunityModal(true);
  }

  async function handleSubmitCommunity() {
    try {
      setSavingCommunity(true);
      setErrorMessage("");
      setSuccessMessage("");

      const nextZipcodes = zipcodesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const parsedAddressItems = addressItemsForm
        .map((item) => ({
          type: item.type.trim().toLowerCase(),
          label: item.label.trim(),
          value: item.value.trim(),
          address_number: (item.address_number ?? "").toString().trim(),
        }))
        .filter((item) => item.type && item.label && item.value);

      const payload: CommunityData = {
        ...communityForm,
        zipcodes: nextZipcodes,
        addressItems: parsedAddressItems,
      };

      if (editingCommunityKey) {
        await updateCommunityAsAdmin(editingCommunityKey, payload);
        setSuccessMessage("Comunidade atualizada com sucesso.");
      } else {
        await createCommunityAsAdmin(payload);
        setSuccessMessage("Comunidade criada com sucesso.");
      }

      setShowCommunityModal(false);
      await loadCommunities();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao salvar comunidade. Revise os campos de endereços.";
      setErrorMessage(message);
    } finally {
      setSavingCommunity(false);
    }
  }

  function addAddressItemRow() {
    setAddressItemsForm((prev) => [...prev, createEmptyAddressItem()]);
  }

  function removeAddressItemRow(index: number) {
    setAddressItemsForm((prev) =>
      prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function updateAddressItemRow(
    index: number,
    field: keyof CommunityAddressItem,
    value: string,
  ) {
    setAddressItemsForm((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
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

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Comunidades</h2>
                <p className="text-sm text-zinc-400">
                  Cadastre e edite associações e seus endereços por JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateCommunityModal}
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
              >
                Nova comunidade
              </button>
            </div>

            {loadingCommunities ? <div className="p-5 text-zinc-300">Carregando comunidades...</div> : null}
            {!loadingCommunities ? (
              <div className="grid grid-cols-1 divide-y divide-zinc-800">
                {communities.map((item) => (
                  <div key={item.key} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-zinc-400">key: {item.key}</p>
                      <p className="text-xs text-zinc-400">
                        CEPs: {item.zipcodes.length} • Endereços: {item.addressItems.length} • {item.active ? "Ativa" : "Inativa"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditCommunityModal(item)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        {showCommunityModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold text-white">
                {editingCommunityKey ? "Editar comunidade" : "Nova comunidade"}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input value={communityForm.label} onChange={(e) => setCommunityForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="Nome da associação" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" />
                <input value={communityForm.key} onChange={(e) => setCommunityForm((prev) => ({ ...prev, key: e.target.value }))} placeholder="key (ex: morro_x)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" disabled={Boolean(editingCommunityKey)} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={communityForm.active} onChange={(e) => setCommunityForm((prev) => ({ ...prev, active: e.target.checked }))} /> Ativa
              </label>
              <div className="mt-4">
                <p className="mb-1 text-sm text-zinc-300">CEPs (1 por linha)</p>
                <textarea value={zipcodesText} onChange={(e) => setZipcodesText(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-300">Endereços (linha a linha)</p>
                  <button
                    type="button"
                    onClick={addAddressItemRow}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
                  >
                    <Plus size={13} />
                    Adicionar linha
                  </button>
                </div>
                <div className="space-y-2">
                  {addressItemsForm.map((item, index) => (
                    <div
                      key={`${item.value}-${index}`}
                      className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 md:grid-cols-[160px_1fr_1fr_120px_auto]"
                    >
                      <select
                        value={item.type}
                        onChange={(event) =>
                          updateAddressItemRow(index, "type", event.target.value)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      >
                        {ADDRESS_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.label}
                        onChange={(event) =>
                          updateAddressItemRow(index, "label", event.target.value)
                        }
                        placeholder="Label (ex: M2 - Quadra)"
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      />
                      <input
                        value={item.value}
                        onChange={(event) =>
                          updateAddressItemRow(index, "value", event.target.value)
                        }
                        placeholder="Value (ex: m2q-1)"
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      />
                      <input
                        value={item.address_number ?? ""}
                        onChange={(event) =>
                          updateAddressItemRow(
                            index,
                            "address_number",
                            event.target.value,
                          )
                        }
                        placeholder="Número"
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeAddressItemRow(index)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-500/40 px-2 py-2 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowCommunityModal(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200">Cancelar</button>
                <button type="button" onClick={() => void handleSubmitCommunity()} disabled={savingCommunity} className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-60">{savingCommunity ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </MainLayout>
    </DashboardLayout>
  );
}
