import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/services/supabase/client";
import SectionCard from "@/components/superAdmin/SectionCard";
import UsersSection from "@/components/superAdmin/UsersSection";
import {
  createCommunityAsAdmin,
  getAdminManageableUsers,
  getPlatformThirdPartyStripeStatus,
  listCommunitiesAsAdmin,
  openPlatformThirdPartyStripeAccount,
  updateCommunityAsAdmin,
  updateUserCommunityAsAdmin,
  updateUserRoleAsAdmin,
} from "@/services/supabase/admin";
import type {
  ManageableUser,
  PlatformThirdPartyStripeStatus,
  UserRole,
} from "@/types/admin";
import type { CommunityAddressItem, CommunityData } from "@/types/community";

const ADDRESS_TYPE_OPTIONS = [
  { value: "street", label: "Street (Rua)" },
  { value: "block", label: "Block (Quadra)" },
  { value: "lane", label: "Lane (Travessa)" },
  { value: "village", label: "Village (Vila)" },
  { value: "building", label: "Building (Prédio)" },
  { value: "others", label: "Others (Outros)" },
] as const;

type AddressItemForm = CommunityAddressItem & {
  clientId: string;
};

function createAddressItemForm(item?: CommunityAddressItem): AddressItemForm {
  return {
    clientId: crypto.randomUUID(),
    type: item?.type ?? "street",
    label: item?.label ?? "",
    value: item?.value ?? "",
    address_number: item?.address_number ?? "",
  };
}

function StripePartnerStatusBadge({
  status,
}: {
  status: PlatformThirdPartyStripeStatus | null;
}) {
  if (!status?.connected)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
        <Clock3 size={13} />
        Não conectada
      </span>
    );
  if (status.stripe_onboarding_completed)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <CheckCircle2 size={13} />
        Conta ativa
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
      <ShieldAlert size={13} />
      Cadastro pendente
    </span>
  );
}

export default function SuperAdminPage() {
  const [openSectionId, setOpenSectionId] = useState<string | null>("stripe");
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [communityFilter, setCommunityFilter] = useState("");
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
  const [addressItemsForm, setAddressItemsForm] = useState<AddressItemForm[]>([
    createAddressItemForm(),
  ]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const byName = user.fullname
          .toLowerCase()
          .includes(searchText.trim().toLowerCase());
        const byCommunity = communityFilter
          ? user.comunity === communityFilter
          : true;
        return byName && byCommunity;
      }),
    [users, searchText, communityFilter],
  );

  async function loadStripePartnerStatus() {
    /* unchanged */
    try {
      setLoadingStripePartnerStatus(true);
      setStripePartnerStatus(await getPlatformThirdPartyStripeStatus());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar status da Stripe do sócio.",
      );
    } finally {
      setLoadingStripePartnerStatus(false);
    }
  }

  async function loadCommunities() {
    try {
      setLoadingCommunities(true);
      setCommunities(await listCommunitiesAsAdmin());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar comunidades.",
      );
    } finally {
      setLoadingCommunities(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        const [{ data: authData }, usersData] = await Promise.all([
          supabase.auth.getUser(),
          getAdminManageableUsers(),
          loadStripePartnerStatus(),
          loadCommunities(),
        ]);
        setCurrentUserId(authData.user?.id ?? null);
        setUsers(usersData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar usuários.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("stripe_partner");
    if (p === "return")
      setSuccessMessage(
        "Retorno da Stripe recebido. Sincronizando status da conta do sócio...",
      );
    if (p === "refresh")
      setSuccessMessage(
        "O link da Stripe expirou ou foi reaberto. Clique novamente para gerar um novo link.",
      );
    if (p) void loadStripePartnerStatus();
  }, []);

  async function handleRoleChange(
    userId: string,
    newRole: Extract<UserRole, "user" | "employee" | "president">,
  ) {
    if (userId === currentUserId) {
      setErrorMessage("Você não pode alterar sua própria role.");
      return;
    }
    try {
      setUpdatingUserId(userId);
      setErrorMessage("");
      setSuccessMessage("");
      await updateUserRoleAsAdmin(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setSuccessMessage("Permissão atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar role.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleCommunityChange(userId: string, communityKey: string) {
    try {
      setUpdatingUserId(userId);
      setErrorMessage("");
      setSuccessMessage("");
      await updateUserCommunityAsAdmin(userId, communityKey || null);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, comunity: communityKey || null } : u,
        ),
      );
      setSuccessMessage("Comunidade do usuário atualizada.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar comunidade do usuário.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  const toggleSection = (id: string) =>
    setOpenSectionId((prev) => (prev === id ? null : id));
  const stripeBtn = openingStripePartner
    ? "Abrindo Stripe..."
    : !stripePartnerStatus?.connected
      ? "Conectar Stripe do sócio"
      : stripePartnerStatus.stripe_onboarding_completed
        ? "Abrir painel Stripe"
        : "Continuar cadastro Stripe";

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
    setAddressItemsForm([createAddressItemForm()]);
    setShowCommunityModal(true);
  }
  function openEditCommunityModal(item: CommunityData) {
    setEditingCommunityKey(item.key);
    setCommunityForm(item);
    setZipcodesText(item.zipcodes.join("\n"));
    setAddressItemsForm(
      item.addressItems.length
        ? item.addressItems.map((addressItem) =>
            createAddressItemForm(addressItem),
          )
        : [createAddressItemForm()],
    );
    setShowCommunityModal(true);
  }
  const addAddressItemRow = () =>
    setAddressItemsForm((prev) => [...prev, createAddressItemForm()]);
  const removeAddressItemRow = (index: number) =>
    setAddressItemsForm((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  const updateAddressItemRow = (
    index: number,
    field: keyof CommunityAddressItem,
    value: string,
  ) =>
    setAddressItemsForm((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  async function handleSubmitCommunity() {
    try {
      setSavingCommunity(true);
      const payload: CommunityData = {
        ...communityForm,
        zipcodes: zipcodesText
          .split("\n")
          .map((i) => i.trim())
          .filter(Boolean),
        addressItems: addressItemsForm
          .map<CommunityAddressItem>((item) => ({
            type: item.type.trim().toLowerCase(),
            label: item.label.trim(),
            value: item.value.trim(),
            address_number: (item.address_number ?? "").toString().trim(),
          }))
          .filter((item) => item.type && item.label && item.value),
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editingCommunityKey
        ? await updateCommunityAsAdmin(editingCommunityKey, payload)
        : await createCommunityAsAdmin(payload);
      setSuccessMessage(
        editingCommunityKey
          ? "Comunidade atualizada com sucesso."
          : "Comunidade criada com sucesso.",
      );
      setShowCommunityModal(false);
      await loadCommunities();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar comunidade.",
      );
    } finally {
      setSavingCommunity(false);
    }
  }

  async function handleOpenStripePartner() {
    try {
      setOpeningStripePartner(true);
      const response = await openPlatformThirdPartyStripeAccount();
      setStripePartnerStatus(response);
      if (response.url) window.location.assign(response.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao abrir a conta Stripe do sócio.",
      );
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

          <SectionCard
            id="stripe"
            title="Stripe do sócio"
            description="Conta integrada que receberá a parte do parceiro nos splits da plataforma."
            icon={<Circle size={20} />}
            isOpen={openSectionId === "stripe"}
            onToggle={toggleSection}
            headerAction={
              <StripePartnerStatusBadge status={stripePartnerStatus} />
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3">
                {loadingStripePartnerStatus ? (
                  <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    <LoaderCircle size={16} className="animate-spin" />
                    Consultando status da conta Stripe...
                  </div>
                ) : (
                  <>
                    {stripePartnerStatus?.stripe_onboarding_completed ? (
                      <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                        <p>Conta liberada para repasse de terceiro.</p>
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/40 bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {openingStripePartner ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <ExternalLink size={16} />
                )}
                {stripeBtn}
              </button>
            </div>
          </SectionCard>

          <UsersSection
            id="users"
            isOpen={openSectionId === "users"}
            onToggle={toggleSection}
            users={filteredUsers}
            communities={communities}
            loading={loading}
            updatingUserId={updatingUserId}
            currentUserId={currentUserId}
            searchText={searchText}
            selectedCommunity={communityFilter}
            onSearchTextChange={setSearchText}
            onCommunityFilterChange={setCommunityFilter}
            onRoleChange={(u, r) => void handleRoleChange(u, r)}
            onUserCommunityChange={(u, c) => void handleCommunityChange(u, c)}
          />

          <SectionCard
            id="communities"
            title="Comunidades"
            description="Cadastre e edite comunidades e seus endereços."
            icon={<Plus size={19} />}
            isOpen={openSectionId === "communities"}
            onToggle={toggleSection}
            headerAction={
              <button
                type="button"
                onClick={openCreateCommunityModal}
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
              >
                Nova comunidade
              </button>
            }
          >
            {loadingCommunities ? (
              <div className="text-zinc-300">Carregando comunidades...</div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-zinc-800">
                {communities.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col text-left gap-3 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-zinc-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        key: {item.key}
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
            )}
          </SectionCard>
        </div>

        {showCommunityModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              {/* modal unchanged */}
              <h3 className="text-lg font-semibold text-white">
                {editingCommunityKey ? "Editar comunidade" : "Nova comunidade"}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={communityForm.label}
                  onChange={(e) =>
                    setCommunityForm((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Nome da Comunidade (ex: Morro do X)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                />
                <input
                  value={communityForm.key}
                  onChange={(e) =>
                    setCommunityForm((p) => ({ ...p, key: e.target.value }))
                  }
                  placeholder="key (ex: morro_x)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                  disabled={Boolean(editingCommunityKey)}
                />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={communityForm.active}
                  onChange={(e) =>
                    setCommunityForm((p) => ({
                      ...p,
                      active: e.target.checked,
                    }))
                  }
                />{" "}
                Ativa
              </label>
              <div className="mt-4">
                <p className="mb-1 text-sm text-zinc-300">CEPs (1 por linha)</p>
                <textarea
                  value={zipcodesText}
                  onChange={(e) => setZipcodesText(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-300">
                    Endereços (linha a linha)
                  </p>
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
                      key={item.clientId}
                      className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 md:grid-cols-[160px_1fr_1fr_120px_auto]"
                    >
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateAddressItemRow(index, "type", e.target.value)
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
                        onChange={(e) =>
                          updateAddressItemRow(index, "label", e.target.value)
                        }
                        placeholder="Label"
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      />
                      <input
                        value={item.value}
                        onChange={(e) =>
                          updateAddressItemRow(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-100"
                      />
                      <input
                        value={item.address_number ?? ""}
                        onChange={(e) =>
                          updateAddressItemRow(
                            index,
                            "address_number",
                            e.target.value,
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
                <button
                  type="button"
                  onClick={() => setShowCommunityModal(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitCommunity()}
                  disabled={savingCommunity}
                  className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                  {savingCommunity ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </MainLayout>
    </DashboardLayout>
  );
}
