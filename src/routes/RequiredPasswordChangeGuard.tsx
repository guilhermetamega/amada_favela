import { Navigate, Outlet } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";
import RouteSkeleton from "@/components/ui/RouteSkeleton";
import { usePermissions } from "@/hooks/usePermissions";

export default function RequiredPasswordChangeGuard() {
  const { loading, error, passwordChangeRequired, refreshPermissions } =
    usePermissions();

  if (loading) {
    return <RouteSkeleton />;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
        <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-500/20 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle size={24} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Não foi possível validar seu acesso
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void refreshPermissions()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <RotateCcw size={17} />
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  if (passwordChangeRequired) {
    return <Navigate to="/security/change-password" replace />;
  }

  return <Outlet />;
}
