import { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { createSponsorRaffle, getSponsorRaffles } from "@/services/supabase/raffles";

export default function SponsorRafflesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salesEndAt, setSalesEndAt] = useState("");
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [price, setPrice] = useState("10.00");
  const [files, setFiles] = useState<File[]>([]);

  async function load() {
    setLoading(true);
    const data = await getSponsorRaffles();
    setItems(data);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const shareUrl = useMemo(() => items[0] ? `${window.location.origin}/raffles/${items[0].slug}` : "", [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createSponsorRaffle({
      title, description, salesEndAt, totalNumbers,
      numberPriceCents: Math.round(Number(price.replace(",", ".")) * 100),
      images: files,
    });
    setTitle("");setDescription("");setSalesEndAt("");setFiles([]);
    await load();
  }

  return <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:py-8"><div className="mx-auto max-w-6xl"><DashboardHeader title="Rifas" />
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <input className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="Título" value={title} onChange={(e)=>setTitle(e.target.value)} required />
      <textarea className="w-full rounded-xl border p-3 dark:bg-zinc-800" placeholder="Descrição" value={description} onChange={(e)=>setDescription(e.target.value)} required />
      <input type="datetime-local" className="w-full rounded-xl border p-3 dark:bg-zinc-800" value={salesEndAt} onChange={(e)=>setSalesEndAt(e.target.value)} required />
      <input type="number" min={1} className="w-full rounded-xl border p-3 dark:bg-zinc-800" value={totalNumbers} onChange={(e)=>setTotalNumbers(Number(e.target.value))} required />
      <input className="w-full rounded-xl border p-3 dark:bg-zinc-800" value={price} onChange={(e)=>setPrice(e.target.value)} required />
      <input type="file" accept="image/*" multiple onChange={(e)=>setFiles(Array.from(e.target.files || []).slice(0,4))} />
      <button className="rounded-xl bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900">Criar rifa</button>
    </form>
    <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {loading ? "Carregando..." : items.map((it)=> <div key={it.id} className="mb-3 text-sm">{it.title} · Link: {`${window.location.origin}/raffles/${it.slug}`}</div>)}
      {shareUrl ? <div className="text-xs text-zinc-500">Último link: {shareUrl}</div> : null}
    </section>
  </div></MainLayout>;
}
