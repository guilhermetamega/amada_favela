import { Link, useSearchParams } from "react-router-dom";

function getCopy(status: string | null) {
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
      "No Pix, a confirmação real depende do webhook da Stripe. Depois da autenticação no banco, o sistema concluirá o split e atualizará o status da mensalidade.",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");

  const content = getCopy(status);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
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

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/member-card"
              className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Voltar para a carteirinha
            </Link>

            <Link
              to="/dashboard"
              className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Ir ao dashboard
            </Link>
          </div>

          <p className="mt-6 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Observação: em pagamentos Pix pelo Checkout, a Stripe pode manter o
            usuário na página de instruções do pagamento. O retorno visual não é
            a fonte da verdade do processo financeiro.
          </p>
        </section>
      </div>
    </main>
  );
}
