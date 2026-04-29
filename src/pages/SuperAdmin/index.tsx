import { useEffect, useMemo, useState } from "react";
import { Circle, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import SectionCard from "@/components/superAdmin/SectionCard";
import UserManagementSection from "@/components/superAdmin/UserManagementSection";
import CommunitySection from "@/components/superAdmin/CommunitySection";
import {
  createCommunityAsAdmin,
  getAdminManageableUsers,
  listCommunitiesAsAdmin,
  updateCommunityAsAdmin,
  updateUserCommunityAsAdmin,
  updateUserRoleAsAdmin,
} from "@/services/supabase/admin";
import type { ManageableUser, UserRole } from "@/types/admin";
import type { CommunityAddressItem, CommunityData } from "@/types/community";

function createEmptyAddressItem(): CommunityAddressItem {
  return { type: "street", label: "", value: "", address_number: "" };
}

type Section = "stripe" | "users" | "communities";

export default function SuperAdminPage() {
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<Section>("users");

  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [editingCommunityKey, setEditingCommunityKey] = useState<string | null>(null);
  const [communityForm, setCommunityForm] = useState<CommunityData>({ key: "", label: "", active: true, zipcodes: [], addressItems: [] });
  const [zipcodesText, setZipcodesText] = useState("");
  const [addressItemsForm, setAddressItemsForm] = useState<CommunityAddressItem[]>([createEmptyAddressItem()]);

  const filteredUsers = useMemo(() => users.filter((user) => user.fullname.toLowerCase().includes(userSearch.toLowerCase().trim())), [users, userSearch]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usersData, communitiesData] = await Promise.all([getAdminManageableUsers(), listCommunitiesAsAdmin()]);
        setUsers(usersData);
        setCommunities(communitiesData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
        setLoadingCommunities(false);
      }
    }
    void loadData();
  }, []);

  async function handleRoleChange(userId: string, newRole: "user" | "employee" | "president") {
    try {
      setUpdatingUserId(userId);
      await updateUserRoleAsAdmin(userId, newRole);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole as UserRole } : user)));
      setSuccessMessage("Permissão atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao atualizar role.");
    } finally { setUpdatingUserId(null); }
  }

  async function handleCommunityChange(userId: string, community: string) {
    try {
      await updateUserCommunityAsAdmin(userId, community.trim());
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, comunity: community.trim() || null } : user)));
      setSuccessMessage("Community atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao atualizar community.");
    }
  }

  function openCreateCommunityModal() { setEditingCommunityKey(null); setCommunityForm({ key: "", label: "", active: true, zipcodes: [], addressItems: [] }); setZipcodesText(""); setAddressItemsForm([createEmptyAddressItem()]); setShowCommunityModal(true); }
  function openEditCommunityModal(item: CommunityData) { setEditingCommunityKey(item.key); setCommunityForm(item); setZipcodesText(item.zipcodes.join("\n")); setAddressItemsForm(item.addressItems.length ? item.addressItems : [createEmptyAddressItem()]); setShowCommunityModal(true); }

  async function handleSubmitCommunity() {
    try {
      setSavingCommunity(true);
      const payload: CommunityData = { ...communityForm, zipcodes: zipcodesText.split("\n").map((i) => i.trim()).filter(Boolean), addressItems: addressItemsForm.filter((i) => i.type && i.label && i.value) };
      if (editingCommunityKey) await updateCommunityAsAdmin(editingCommunityKey, payload); else await createCommunityAsAdmin(payload);
      setShowCommunityModal(false);
      setLoadingCommunities(true);
      setCommunities(await listCommunitiesAsAdmin());
      setLoadingCommunities(false);
    } finally { setSavingCommunity(false); }
  }

  return <DashboardLayout><MainLayout><div className="mx-auto max-w-6xl space-y-6"><DashboardHeader title="Super Admin" description="Gerencie usuários globais e contas integradas da plataforma." />
    {errorMessage ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{errorMessage}</div> : null}
    {successMessage ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{successMessage}</div> : null}

    <SectionCard title="Stripe do sócio" description="Área reservada para integração Stripe." icon={<Circle size={20} />} isExpanded={expandedSection === "stripe"} onToggle={() => setExpandedSection("stripe")}>
      <p className="text-zinc-300">Abra esta área para próximos ajustes de Stripe.</p>
    </SectionCard>

    <SectionCard title="Usuários globais" description="Gerencie roles e community dos usuários." icon={<Users size={19} />} isExpanded={expandedSection === "users"} onToggle={() => setExpandedSection("users")}>
      <UserManagementSection users={filteredUsers} loading={loading} updatingUserId={updatingUserId} search={userSearch} onSearchChange={setUserSearch} onRoleChange={(id, role) => void handleRoleChange(id, role)} onCommunityChange={(id, community) => void handleCommunityChange(id, community)} />
    </SectionCard>

    <SectionCard title="Comunidades" description="Cadastre e edite comunidades e seus endereços." icon={<Circle size={20} />} isExpanded={expandedSection === "communities"} onToggle={() => setExpandedSection("communities")}>
      <CommunitySection communities={communities} loading={loadingCommunities} onCreate={openCreateCommunityModal} onEdit={openEditCommunityModal} />
    </SectionCard>

    {showCommunityModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3"><input value={communityForm.label} onChange={(e) => setCommunityForm((p) => ({ ...p, label: e.target.value }))} placeholder="Nome" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" /><input value={communityForm.key} onChange={(e) => setCommunityForm((p) => ({ ...p, key: e.target.value }))} placeholder="key" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" disabled={Boolean(editingCommunityKey)} /><textarea value={zipcodesText} onChange={(e) => setZipcodesText(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" />
    <div className="flex justify-end gap-2"><button onClick={() => setShowCommunityModal(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200">Cancelar</button><button onClick={() => void handleSubmitCommunity()} disabled={savingCommunity} className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white">Salvar</button></div></div></div> : null}
  </div></MainLayout></DashboardLayout>;
}
