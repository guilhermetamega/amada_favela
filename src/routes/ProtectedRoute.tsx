import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-zinc-300 shadow-xl">
          Carregando...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/Auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
