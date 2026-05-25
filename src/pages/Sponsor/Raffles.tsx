import { useEffect, useMemo, useState, type FormEvent } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getSponsorProfile } from "@/lib/sponsorSession";
import {
  createSponsorRaffle,
  getSponsorRaffleInsights,
  getSponsorRaffleStatus,
  getSponsorRaffles,
  startSponsorMercadoPagoConnect,
} from "@/services/supabase/raffles";
import type { SponsorRaffle, SponsorRaffleInsights } from "@/types/raffle";

export default function SponsorRafflesPage() {
  const sponsorId = getSponsorProfile()?.sponsor.id ?? "";
  const [items, setItems] = useState<SponsorRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mpConnected, setMpConnected] = useState(false);
  const [mpStatusMessage, setMpStatusMessage] = useState("");
  const [mpConnecting, setMpConnecting] = useState(false);

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

  const latestShareUrl = useMemo(
    () =>
      items[0] ? `${window.location.origin}/raffles/${items[0].slug}` : "",
    [items],
  );

  async function load() {
    try {
      setLoading(true);
      setErrorMessage("");
      const [data, raffleStatus] = await Promise.all([
        getSponsorRaffles(),
        getSponsorRaffleStatus(),
      ]);
      const onlyCurrentSponsor = data.filter(
        (item) => item.sponsor_id === sponsorId,
      );
      setItems(onlyCurrentSponsor);
      setMpConnected(raffleStatus.connected);
      setMpStatusMessage(raffleStatus.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar rifas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("mercadopago");
    const message = params.get("message");

    if (state === "success") {
      setSuccessMessage("Conta Mercado Pago conectada com sucesso.");
    }
    if (state === "error") {
      setErrorMessage(message || "Falha ao conectar Mercado Pago.");
    }

    if (state) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    void load();
  }, []);

  async function connectMercadoPago() {
    if (mpConnecting) return;
    setMpConnecting(true);
    setErrorMessage("");

    try {
      const url = await startSponsorMercadoPagoConnect();
      window.location.assign(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao conectar Mercado Pago.",
      );
    } finally {
      setMpConnecting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !mpConnected) return;

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
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar rifa.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openInsights(raffleId: string) {
    setInsightsOpen(true);
    setInsightsLoading(true);
    setInsights(null);

    try {
      const data = await getSponsorRaffleInsights(raffleId);
      setInsights(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar detalhes da rifa.",
      );
    } finally {
      setInsightsLoading(false);
    }
  }

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <DashboardHeader title="Rifas" />

        {mpStatusMessage ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              mpConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{mpStatusMessage}</span>
              {!mpConnected ? (
                <button
                  type="button"
                  onClick={connectMercadoPago}
                  disabled={mpConnecting}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                  {mpConnecting ? "Conectando..." : "Conectar Mercado Pago"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Título da rifa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                value={salesEndAt}
                onChange={(e) => setSalesEndAt(e.target.value)}
                required
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                  value={totalNumbers}
                  onChange={(e) => setTotalNumbers(Number(e.target.value))}
                  required
                />
                <input
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setFiles(Array.from(e.target.files || []).slice(0, 4))
                }
                className="w-full text-sm"
              />
              <button
                disabled={saving || !mpConnected}
                className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-zinc-900"
              >
                {saving ? "Salvando..." : "Criar rifa"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold">
              Links de compartilhamento
            </h2>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-500">Carregando...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{it.title}</span>
                      <button
                        onClick={() => void openInsights(it.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-300"
                      >
                        Ver arrecadação
                      </button>
                    </div>
                    <p className="mt-2">
                      {window.location.origin}/raffles/{it.slug}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {latestShareUrl ? (
              <p className="mt-4 text-xs text-zinc-500">
                Último link: {latestShareUrl}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {insightsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/70 p-4"
          onClick={() => setInsightsOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Resumo da rifa</h3>
              <button
                className="rounded-xl border px-3 py-1 text-sm"
                onClick={() => setInsightsOpen(false)}
              >
                Fechar
              </button>
            </div>
            {insightsLoading || !insights ? (
              <p className="text-sm text-zinc-500">Carregando detalhes...</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">
                  R$ {(insights.total_raised_cents / 100).toFixed(2)}
                </p>
                <p>
                  Número vencedor:{" "}
                  {insights.raffle.winning_number ?? "Pendente"}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
