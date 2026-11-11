import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, RefreshCw, Search, Store } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";
import { deleteDiscountStore, getAdminDiscountStores, getStoreCatalog, saveDiscountStore, updateDiscountStoreStatus } from "@/services/supabase/discount_club";
import type { DiscountStore, StoreCatalogItem } from "@/types/discount_club";

export default function AdminDiscountClubPage() {
  const [stores, setStores] = useState<DiscountStore[]>([]);
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [discount, setDiscount] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [editing, setEditing] = useState<DiscountStore | null>(null);

  async function load() {
    try { setLoading(true); setError(""); setStores(await getAdminDiscountStores()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao carregar lojas."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function loadCatalog() {
    try { setCatalogLoading(true); setError(""); setCatalog(await getStoreCatalog()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao consultar a API de lojas."); }
    finally { setCatalogLoading(false); }
  }

  const selected = catalog.find((item) => item.id === selectedId) ?? null;
  const catalogMatches = useMemo(() => catalog.filter((item) => `${item.name} ${item.niche ?? ""} ${item.community ?? ""}`.toLocaleLowerCase("pt-BR").includes(catalogQuery.toLocaleLowerCase("pt-BR"))).slice(0, 100), [catalog, catalogQuery]);
  const filteredStores = useMemo(() => stores.filter((item) => `${item.name} ${item.niche ?? ""}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [stores, query]);

  function startEdit(item: DiscountStore) {
    setEditing(item); setSelectedId(item.api_store_id); setDiscount(String(item.discount_percent)); setPhoto(null);
    const match = catalog.find((row) => row.id === item.api_store_id);
    if (!match) setCatalog((prev) => [...prev, { id: item.api_store_id, name: item.name, niche: item.niche, community: item.community, photoUrl: item.photo_url, whatsapp: item.whatsapp, premium: item.premium, sourceData: item.source_data }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    try { setSaving(true); setError(""); setSuccess(""); const saved = await saveDiscountStore(selected, Number(discount.replace(",", ".")), photo, editing?.status ?? "active", editing?.id); setStores((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]); setSuccess("Loja salva com sucesso."); setEditing(null); setSelectedId(""); setDiscount(""); setPhoto(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao salvar loja."); }
    finally { setSaving(false); }
  }

  async function toggleStatus(item: DiscountStore) {
    try { const updated = await updateDiscountStoreStatus(item.id, item.status === "active" ? "inactive" : "active"); setStores((prev) => prev.map((row) => row.id === item.id ? updated : row)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao atualizar status."); }
  }

  async function remove(item: DiscountStore) {
    if (!window.confirm(`Remover ${item.name} do Clube de Descontos?`)) return;
    try { await deleteDiscountStore(item.id); setStores((prev) => prev.filter((row) => row.id !== item.id)); setSuccess("Loja removida do clube."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao remover loja."); }
  }

  return <DashboardLayout><MainLayout><div className="mx-auto max-w-7xl space-y-5"><DashboardHeader title="Clube de Descontos" />
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-800 dark:text-sky-200">Cadastre lojas da API por comunidade, defina o desconto e publique os benefícios. O fluxo de cobrança será integrado em uma etapa futura.</div>
    {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}{success && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{success}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
      <section className="h-fit rounded-3xl border border-zinc-200 bg-white p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-5"><h2 className="text-lg font-black text-zinc-900 dark:text-white">{editing ? "Editar benefício" : "Adicionar loja"}</h2>
        <button type="button" onClick={() => void loadCatalog()} disabled={catalogLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-200 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${catalogLoading ? "animate-spin" : ""}`} />{catalogLoading ? "Consultando catálogo..." : catalog.length ? "Atualizar lojas do catálogo" : "Carregar lojas do Lojas do Mandela"}</button>
        {catalog.length > 0 && <div className="mt-4 space-y-3"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Buscar por nome, nicho ou comunidade" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" /></label><div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-1 dark:border-zinc-700">{catalogMatches.map((item) => <button type="button" key={item.id} onClick={() => { setEditing(null); setSelectedId(item.id); setDiscount(""); setPhoto(null); }} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${item.id === selectedId ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}><span className="min-w-0 truncate">{item.name}<small className="block truncate text-xs opacity-70">{item.niche ?? "Sem nicho"} · {item.community ?? "Comunidade não informada"}</small></span>{item.premium && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />}</button>)}</div><p className="text-xs text-zinc-500">Exibindo até 100 correspondências. {catalog.length} lojas no catálogo.</p></div>}
        {selected && <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"><div className="rounded-2xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950"><strong className="text-zinc-900 dark:text-white">{selected.name}</strong><span className="mt-1 block text-zinc-500">{selected.niche ?? "Nicho não informado"} · {selected.community ?? "Comunidade não informada"}</span>{selected.premium && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-300"><BadgeCheck className="h-4 w-4" /> Premium no Lojas</span>}</div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Desconto para moradores (%)<input type="number" min="1" max="100" step="0.01" required value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="Ex.: 10" className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" /></label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Foto da loja (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 dark:text-zinc-300 dark:file:bg-zinc-800" /><span className="mt-1 block text-xs text-zinc-500">Se não enviar, usamos a foto do catálogo.</span></label>
          <div className="flex gap-2"><button disabled={saving} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar ao clube"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setSelectedId(""); setDiscount(""); }} className="rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700 dark:text-zinc-200">Cancelar</button>}</div>
        </form>}
      </section>
      <section className="space-y-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-black text-zinc-900 dark:text-white">Lojas da comunidade</h2><p className="text-sm text-zinc-500">{stores.length} cadastradas</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar lojas" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" /></div>
        {loading && <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">Carregando lojas...</div>}{!loading && filteredStores.length === 0 && <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Nenhuma loja cadastrada.</div>}
        <div className="grid gap-3 md:grid-cols-2">{filteredStores.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="flex gap-3 p-4">{item.photo_url ? <img src={item.photo_url} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Store /></div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-bold text-zinc-900 dark:text-white">{item.name}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>{item.status === "active" ? "Visível" : "Oculta"}</span></div><p className="mt-1 text-xs text-zinc-500">{item.niche ?? "Comércio local"} · {item.community}</p><p className="mt-2 text-sm font-black text-emerald-700 dark:text-emerald-300">{item.discount_percent}% de desconto {item.premium && <BadgeCheck className="inline h-4 w-4 text-sky-500" />}</p></div></div><div className="flex flex-wrap gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800"><button onClick={() => startEdit(item)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700 dark:text-zinc-200">Editar</button><button onClick={() => void toggleStatus(item)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700 dark:text-zinc-200">{item.status === "active" ? "Ocultar" : "Publicar"}</button><button onClick={() => void remove(item)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-300">Remover</button></div></article>)}</div>
      </section>
    </div>
  </div></MainLayout></DashboardLayout>;
}
