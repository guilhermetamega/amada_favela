import { useEffect, useMemo, useState } from "react";
import type { RafflePublicDetails } from "@/types/raffle";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import {
  createRafflePixCheckout,
  getPublicRaffleBySlug,
} from "@/services/supabase/raffles";
import RafflePixModal from "@/components/raffles/RafflePixModal";


function normalizeRaffle(raw: unknown): RafflePublicDetails {
  if (!raw || typeof raw !== "object") throw new Error("Rifa não encontrada.");

  const raffle = raw as Partial<RafflePublicDetails>;
  const soldNumbers = Array.isArray(raffle.sold_numbers)
    ? raffle.sold_numbers.filter((value): value is number => Number.isInteger(value))
    : [];

  return {
    ...(raffle as RafflePublicDetails),
    sold_numbers: soldNumbers,
    total_numbers:
      typeof raffle.total_numbers === "number" && raffle.total_numbers > 0
        ? raffle.total_numbers
        : 0,
    number_price_cents:
      typeof raffle.number_price_cents === "number" && raffle.number_price_cents >= 0
        ? raffle.number_price_cents
        : 0,
    status:
      raffle.status === "draft" || raffle.status === "active" || raffle.status === "closed"
        ? raffle.status
        : "draft",
  };
}
const PAGE_SIZE = 250;

export default function PublicRafflePage() {
  const { slug = "" } = useParams();
  const [raffle, setRaffle] = useState<RafflePublicDetails | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [checkout, setCheckout] = useState<any>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await getPublicRaffleBySlug(slug);
        setRaffle(normalizeRaffle(data));
      } catch (error) {
        setRaffle(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar rifa.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug]);

  const closed =
    raffle &&
    (new Date(raffle.sales_end_at).getTime() < Date.now() ||
      raffle.status === "closed");
  const total = useMemo(
    () => (raffle ? selected.length * raffle.number_price_cents : 0),
    [selected, raffle],
  );
  const pageCount = raffle ? Math.max(1, Math.ceil(raffle.total_numbers / PAGE_SIZE)) : 0;
  const numbers = useMemo(() => {
    if (!raffle) return [];
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, raffle.total_numbers);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [raffle, page]);

  async function checkoutPix() {
    if (!raffle || selected.length === 0) {
      setErrorMessage("Selecione ao menos 1 número.");
      return;
    }

    try {
      console.info("[PublicRaffle] checkout start", {
        raffleId: raffle.id,
        selected,
        name,
        phone,
        email,
      });
      setSubmitting(true);
      setErrorMessage("");
      const data = await createRafflePixCheckout({
        raffleId: raffle.id,
        selectedNumbers: selected,
        buyerName: name,
        buyerPhone: phone,
        buyerInstagram: instagram,
        buyerEmail: email,
      });
      console.info("[PublicRaffle] checkout success", data);
      setCheckout(data);
      setPixModalOpen(true);
    } catch (error) {
      console.error("[PublicRaffle] checkout error", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao gerar o pagamento Pix.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        {loading ? (
          "Carregando rifa..."
        ) : !raffle ? (
          "Rifa não encontrada."
        ) : (
          <>
            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            ) : null}
            <>
              <h1 className="text-2xl font-bold">{raffle.title}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {raffle.description}
              </p>

              {closed ? (
                <button className="mt-6 rounded-2xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">
                  Rifa encerrada. Número ganhador:{" "}
                  {raffle.winning_number ?? "-"}
                </button>
              ) : (
                <>
                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                    <span>
                      Página {page} de {pageCount}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded-xl border px-3 py-1 disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={page >= pageCount}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-xl border px-3 py-1 disabled:opacity-40"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {numbers.map((n: number) => {
                      const sold = raffle.sold_numbers?.includes(n) ?? false;
                      const active = selected.includes(n);
                      return (
                        <button
                          key={n}
                          disabled={sold}
                          onClick={() =>
                            setSelected((prev) =>
                              prev.includes(n)
                                ? prev.filter((x) => x !== n)
                                : [...prev, n],
                            )
                          }
                          className={`rounded-lg border p-2 text-xs ${sold ? "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600" : "border-zinc-300 dark:border-zinc-700"} ${active ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : ""}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3">
                    <input
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <input
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                      placeholder="Whatsapp"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <input
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                      placeholder="Instagram (opcional)"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                    <input
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      disabled={submitting}
                      onClick={checkoutPix}
                      className="w-full rounded-2xl bg-zinc-900 px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                    >
                      {submitting
                        ? "Gerando Pix..."
                        : `Pagar R$ ${(total / 100).toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}
            </>
          </>
        )}
      </div>
      <RafflePixModal
        open={pixModalOpen}
        pixData={checkout}
        onClose={() => setPixModalOpen(false)}
      />
    </MainLayout>
  );
}
