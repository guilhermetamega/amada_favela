import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, LoaderCircle, Save } from "lucide-react";

import SectionCard from "@/components/superAdmin/SectionCard";
import {
  listAssociationPlatformFeesAsAdmin,
  updateAssociationPlatformFeeAsAdmin,
} from "@/services/supabase/plataform_fees";
import type { AssociationPlatformFeeItem } from "@/types/plataform_fee";

type Props = {
  id: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
};

function formatCents(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}

function parseCurrencyToCents(value: string) {
  const cleaned = value.replace(/R\$/gi, "").replace(/\s+/g, "").trim();

  if (!cleaned) {
    throw new Error("Informe o valor da taxa.");
  }

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0 || amount > 1000) {
    throw new Error("Informe uma taxa entre R$ 0,00 e R$ 1.000,00.");
  }

  return Math.round(amount * 100);
}

function formatMoneyFromDatabase(value: number | string | null) {
  const normalized = Number(String(value ?? 0).replace(",", "."));

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(normalized) ? normalized : 0);
}

function getSplitPreview(platformFeeCents: number) {
  const retained = Math.ceil(platformFeeCents / 2);
  const transferred = platformFeeCents - retained;

  return {
    retained,
    transferred,
  };
}

export default function PlatformFeesSection({ id, isOpen, onToggle }: Props) {
  const [items, setItems] = useState<AssociationPlatformFeeItem[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const activeItems = useMemo(
    () => items.filter((item) => item.is_active),
    [items],
  );

  const inactiveItems = useMemo(
    () => items.filter((item) => !item.is_active),
    [items],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await listAssociationPlatformFeesAsAdmin();

      setItems(result);
      setValues(
        Object.fromEntries(
          result.map((item) => [item.id, formatCents(item.platform_fee_cents)]),
        ),
      );
      setLoaded(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar as taxas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !loaded && !loading) {
      void load();
    }
  }, [isOpen, loaded, loading, load]);

  async function handleSave(associationId: string) {
    try {
      setSavingId(associationId);
      setErrorMessage("");
      setSuccessMessage("");

      const cents = parseCurrencyToCents(values[associationId] ?? "");

      const updated = await updateAssociationPlatformFeeAsAdmin(
        associationId,
        cents,
      );

      setItems((current) =>
        current.map((item) => (item.id === associationId ? updated : item)),
      );

      setValues((current) => ({
        ...current,
        [associationId]: formatCents(updated.platform_fee_cents),
      }));

      setSuccessMessage(
        `Taxa de ${updated.name} atualizada para R$ ${formatCents(
          updated.platform_fee_cents,
        )}.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a taxa.",
      );
    } finally {
      setSavingId(null);
    }
  }

  function renderItem(item: AssociationPlatformFeeItem) {
    let previewCents = item.platform_fee_cents;

    try {
      previewCents = parseCurrencyToCents(
        values[item.id] ?? formatCents(item.platform_fee_cents),
      );
    } catch {
      previewCents = item.platform_fee_cents;
    }

    const split = getSplitPreview(previewCents);

    return (
      <div
        key={item.id}
        className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_190px_auto] lg:items-center"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {item.name}
            </p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                item.is_active
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {item.is_active ? "Ativa" : "Inativa"}
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {item.community} · Mensalidade{" "}
            {formatMoneyFromDatabase(item.monthly_fee)}
          </p>

          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Stripe: R$ {formatCents(split.retained)} retidos pela plataforma +
            R$ {formatCents(split.transferred)} transferidos ao parceiro.
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Mercado Pago: R$ {formatCents(previewCents)} como application fee.
          </p>
        </div>

        <div>
          <label
            htmlFor={`platform-fee-${item.id}`}
            className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Taxa da plataforma
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
              R$
            </span>

            <input
              id={`platform-fee-${item.id}`}
              type="text"
              inputMode="decimal"
              value={values[item.id] ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [item.id]: event.target.value,
                }))
              }
              disabled={savingId === item.id}
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="5,00"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleSave(item.id);
          }}
          disabled={savingId === item.id}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingId === item.id ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {savingId === item.id ? "Salvando..." : "Salvar taxa"}
        </button>
      </div>
    );
  }

  return (
    <SectionCard
      id={id}
      title="Taxas por comunidade"
      description="Configure individualmente a taxa da plataforma cobrada em cada associação."
      icon={<BadgeDollarSign size={20} />}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <LoaderCircle size={16} className="animate-spin" />
          Carregando taxas...
        </div>
      ) : null}

      {!loading && loaded && items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Nenhuma associação cadastrada.
        </div>
      ) : null}

      {!loading && activeItems.length > 0 ? (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {activeItems.map(renderItem)}
        </div>
      ) : null}

      {!loading && inactiveItems.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Associações inativas ({inactiveItems.length})
          </summary>

          <div className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {inactiveItems.map(renderItem)}
          </div>
        </details>
      ) : null}
    </SectionCard>
  );
}
