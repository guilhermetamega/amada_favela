import { useEffect, useMemo, useState, type FormEvent } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  createSponsorRaffle,
  getSponsorRaffles,
} from "@/services/supabase/raffles";
import type { SponsorRaffle } from "@/types/raffle";

export default function SponsorRafflesPage() {
  const [items, setItems] = useState<SponsorRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salesEndAt, setSalesEndAt] = useState("");
  const [totalNumbers, setTotalNumbers] = useState(1000);
  const [price, setPrice] = useState("10,00");
  const [files, setFiles] = useState<File[]>([]);

  async function load() {
    try {
      setLoading(true);
      const data = await getSponsorRaffles();
      setItems(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao carregar rifas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const latestShareUrl = useMemo(
    () => (items[0] ? `${window.location.origin}/raffles/${items[0].slug}` : ""),
    [items],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createSponsorRaffle({
        title,
        description,
        salesEndAt,
        totalNumbers,
        numberPriceCents: Math.round(Number(price.replace(",", ".")) * 100),
        images: files,
      });
      setTitle("");
      setDescription("");
      setSalesEndAt("");
      setFiles([]);
      setSuccessMessage("Rifa criada com sucesso.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao criar rifa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <DashboardHeader title="Rifas" />

        {errorMessage ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</div> : null}
        {successMessage ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">{successMessage}</div> : null}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" placeholder="Título da rifa" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
              <input type="datetime-local" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={salesEndAt} onChange={(e) => setSalesEndAt(e.target.value)} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="number" min={1} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={totalNumbers} onChange={(e) => setTotalNumbers(Number(e.target.value))} required />
                <input className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 4))} className="w-full text-sm" />
              <button disabled={saving} className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-zinc-900">{saving ? "Salvando..." : "Criar rifa"}</button>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold">Links de compartilhamento</h2>
            {loading ? <p className="mt-3 text-sm text-zinc-500">Carregando...</p> : (
              <div className="mt-4 space-y-3">
                {items.map((it) => <div key={it.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">{it.title}<br />{window.location.origin}/raffles/{it.slug}</div>)}
              </div>
            )}
            {latestShareUrl ? <p className="mt-4 text-xs text-zinc-500">Último link: {latestShareUrl}</p> : null}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
