import { House } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks";

export default function NotFoundPage() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Erro 404
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Página não encontrada
        </h1>

        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
          A rota que você tentou acessar não existe, foi alterada ou não está
          disponível no momento.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <House className="h-4 w-4" />
            {user ? "Ir para o Início" : "Ir para Login"}
          </Link>
        </div>
      </div>
    </main>
  );
}
