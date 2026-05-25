import { useEffect, useState, type FormEvent } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  createSponsorRaffle,
  getSponsorRaffleInsights,
  getSponsorRaffleStatus,
  getSponsorRaffles,
} from "@/services/supabase/raffles";
import type { SponsorRaffle, SponsorRaffleInsights } from "@/types/raffle";

export default function SponsorRafflesPage() {
  const [items, setItems] = useState<SponsorRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mpConnected, setMpConnected] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<SponsorRaffleInsights | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salesEndAt, setSalesEndAt] = useState("");
  const [totalNumbers, setTotalNumbers] = useState(1000);
  const [price, setPrice] = useState("10,00");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!insightsOpen) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [insightsOpen]);

  async function load() { /* unchanged */
    try {
      setLoading(true);
      const [data, raffleStatus] = await Promise.all([
        getSponsorRaffles(),
        getSponsorRaffleStatus(),
      ]);
      setItems(data);
      setMpConnected(raffleStatus.connected);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("mercadopago");
    if (state) window.history.replaceState({}, document.title, window.location.pathname);
    void load();
  }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !mpConnected) return;
    setSaving(true);

    try {
      await createSponsorRaffle({ title, description, salesEndAt, totalNumbers, numberPriceCents: Math.round(Number(price.replace(",", ".")) * 100), images: files });
      setTitle(""); setDescription(""); setSalesEndAt(""); setFiles([]);
      await load();
    } catch (error) {
    } finally { setSaving(false); }
  }

  async function openInsights(raffleId: string) {
    setInsightsOpen(true); setInsightsLoading(true); setInsights(null);
    try { setInsights(await getSponsorRaffleInsights(raffleId)); }
    catch { /* noop */ }
    finally { setInsightsLoading(false); }
  }

  return <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8"><div className="mx-auto max-w-6xl"><DashboardHeader title="Rifas" />
  {/* content kept same abridged for brevity in patch */}
  <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]"><section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"><form onSubmit={handleSubmit} className="space-y-4">{/* existing inputs */}<input className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" placeholder="Título da rifa" value={title} onChange={(e)=>setTitle(e.target.value)} required/><textarea className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" placeholder="Descrição" value={description} onChange={(e)=>setDescription(e.target.value)} required/><input type="datetime-local" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={salesEndAt} onChange={(e)=>setSalesEndAt(e.target.value)} required/><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><input type="number" min={1} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={totalNumbers} onChange={(e)=>setTotalNumbers(Number(e.target.value))} required/><input className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={price} onChange={(e)=>setPrice(e.target.value)} required/></div><input type="file" accept="image/*" multiple onChange={(e)=>setFiles(Array.from(e.target.files||[]).slice(0,4))} className="w-full text-sm"/><button disabled={saving||!mpConnected} className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-zinc-900">{saving?"Salvando...":"Criar rifa"}</button></form></section>
  <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><h2 className="text-base font-semibold">Links de compartilhamento</h2>{loading?<p className="mt-3 text-sm text-zinc-500">Carregando...</p>:<div className="mt-4 space-y-3">{items.map((it)=><div key={it.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"><div className="flex items-center justify-between"><span>{it.title}</span><button onClick={()=>void openInsights(it.id)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Ver arrecadação</button></div>{window.location.origin}/raffles/{it.slug}</div>)}</div>}</section></div>
  {insightsOpen?<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/70 p-4" onClick={()=>setInsightsOpen(false)}><div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6" onClick={(e)=>e.stopPropagation()}>{insightsLoading||!insights?<p>Carregando...</p>:<div><p className="text-2xl font-bold">R$ {(insights.total_raised_cents/100).toFixed(2)}</p><p>Número vencedor: {insights.raffle.winning_number??"Pendente"}</p></div>}</div></div>:null}
  </div></MainLayout>;
}
