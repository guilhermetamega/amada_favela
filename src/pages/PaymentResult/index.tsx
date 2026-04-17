import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMembershipCheckoutStatus } from "@/services/supabase/membership";
import type { MembershipCheckoutStatusResponse } from "@/types/membership";
import { usePermissions } from "@/hooks/usePermissions";
import MainLayout from "@/components/layout/MainLayout";

const LOG_PREFIX = "[payment-result]";

type StatusCard = {
  title: string;
  description: string;
  badgeClassName: string;
};

function getBaseCopy(status: string | null): StatusCard {
  if (status === "cancel") {
    return {
      title: "Pagamento cancelado",
      description:
        "Nenhuma cobrança foi concluída. Você pode retornar ao app e iniciar um novo checkout quando quiser.",
      badgeClassName:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    title: "Pagamento iniciado",
    description:
      "Estamos aguardando a confirmação final da Stripe e a sincronização do vínculo de sócio.",
    badgeClassName:
      "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
}

function getResolvedCopy(
  baseStatus: string | null,
  checkoutStatus: MembershipCheckoutStatusResponse | null,
): StatusCard {
  if (baseStatus === "cancel") {
    return getBaseCopy(baseStatus);
  }

  if (!checkoutStatus) {
    return getBaseCopy(baseStatus);
  }

  if (checkoutStatus.partnerActive) {
    return {
      title: "Mensalidade confirmada",
      description:
        "O pagamento foi conciliado e o vínculo do associado já foi liberado.",
      badgeClassName:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (
    ["failed", "cancelled", "refunded", "partially_refunded"].includes(
      checkoutStatus.paymentStatus,
    ) ||
    ["past_due", "cancelled", "expired"].includes(
      checkoutStatus.partnerStatus ?? "",
    )
  ) {
    return {
      title: "Pagamento não concluído",
      description:
        "A cobrança retornou com falha, cancelamento ou pendência financeira. Revise o método de pagamento e tente novamente.",
      badgeClassName:
        "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    };
  }

  return {
    title: "Pagamento em processamento",
    description:
      "A cobrança já existe, mas ainda estamos aguardando a atualização final do vínculo em partners.",
    badgeClassName:
      "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string | null) {
  if (!value) return "Aguardando definição";

  switch (value) {
    case "card":
      return "Cartão";
    case "apple_pay":
      return "Apple Pay";
    case "google_pay":
      return "Google Pay";
    case "boleto":
      return "Boleto";
    case "pix":
      return "Pix";
    case "link":
      return "Link";
    default:
      return value;
  }
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const { refreshPermissions } = usePermissions();

  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");

  const [checkoutStatus, setCheckoutStatus] =
    useState<MembershipCheckoutStatusResponse | null>(null);
  const [loading, setLoading] = useState(status === "success" && !!sessionId);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status !== "success" || !sessionId) {
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;
    const currentSessionId = sessionId;

    async function loadStatus() {
      console.info(`${LOG_PREFIX} poll:start`, { sessionId: currentSessionId });

      try {
        setErrorMessage("");

        const data = await getMembershipCheckoutStatus(currentSessionId);

        if (cancelled) return;

        console.info(`${LOG_PREFIX} poll:success`, {
          sessionId: currentSessionId,
          paymentId: data.paymentId,
          paymentStatus: data.paymentStatus,
          partnerStatus: data.partnerStatus,
          partnerActive: data.partnerActive,
          terminal: data.terminal,
        });

        setCheckoutStatus(data);
        setLoading(false);

        if (data.partnerActive) {
          await refreshPermissions();
        }

        if (data.terminal && intervalId !== null) {
          window.clearInterval(intervalId);
        }
      } catch (error) {
        if (cancelled) return;

        console.error(`${LOG_PREFIX} poll:error`, {
          sessionId: currentSessionId,
          message: error instanceof Error ? error.message : "unknown",
        });

        setLoading(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a cobrança.",
        );
      }
    }

    void loadStatus();

    intervalId = window.setInterval(() => {
      void loadStatus();
    }, 4000);

    return () => {
      cancelled = true;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [refreshPermissions, sessionId, status]);

  const content = useMemo(
    () => getResolvedCopy(status, checkoutStatus),
    [checkoutStatus, status],
  );

  return (
    <MainLayout className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${content.badgeClassName}`}
          >
            Stripe Checkout
          </span>

          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
            {content.title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {content.description}
          </p>

          {sessionId ? (
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Session ID
              </p>
              <p className="mt-1 break-all">{sessionId}</p>
            </div>
          ) : null}

          {status === "success" && sessionId ? (
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Situação atual
              </p>

              <p className="mt-2">
                {loading
                  ? "Consultando Stripe e banco de dados..."
                  : `Pagamento: ${checkoutStatus?.paymentStatus ?? "não identificado"}`}
              </p>

              <p className="mt-1">
                Método:{" "}
                {formatPaymentMethod(checkoutStatus?.paymentMethodType ?? null)}
              </p>

              <p className="mt-1">
                Modo: {checkoutStatus?.checkoutMode ?? "não identificado"}
              </p>

              <p className="mt-1">
                Partner status:{" "}
                {checkoutStatus?.partnerStatus ?? "não definido"}
              </p>

              <p className="mt-1">
                Sócio ativo: {checkoutStatus?.partnerActive ? "sim" : "não"}
              </p>

              <p className="mt-1">
                Vigência: {formatDateTime(checkoutStatus?.expiresAt ?? null)}
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 flex justify-center items-center">
            <Link
              to="/dashboard"
              className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Voltar ao Início
            </Link>
          </div>

          <p className="mt-6 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Esta página consulta periodicamente a cobrança em{" "}
            <code>payments</code> e o vínculo do associado em{" "}
            <code>partners</code>.
          </p>
        </section>
      </div>
    </MainLayout>
  );
}
