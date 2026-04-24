import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

export default function MercadoPagoOAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const message = searchParams.get("message");
  const associationId = searchParams.get("associationId");

  const isSuccess = status === "success";

  const title = useMemo(() => {
    if (isSuccess) return "Conta Mercado Pago conectada";
    return "Não foi possível concluir a conexão";
  }, [isSuccess]);

  const description = useMemo(() => {
    if (isSuccess) {
      return "A conta da associação foi conectada com sucesso. Você será redirecionado para as configurações da associação.";
    }

    return (
      message || "Ocorreu um erro ao concluir a autorização com o Mercado Pago."
    );
  }, [isSuccess, message]);

  useEffect(() => {
    if (!isSuccess) return;

    const timeout = window.setTimeout(() => {
      navigate("/admin/association?mercadopago=success", {
        replace: true,
      });
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
                isSuccess
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
              }`}
            >
              {isSuccess ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
            </div>

            <h1 className="mt-5 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {description}
            </p>

            {associationId ? (
              <p className="mt-3 break-all text-xs text-zinc-500 dark:text-zinc-500">
                Associação: {associationId}
              </p>
            ) : null}

            {isSuccess ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <LoaderCircle size={16} className="animate-spin" />
                Redirecionando para a associação...
              </div>
            ) : (
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  to="/admin/association"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  Voltar para associação
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Ir para dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
