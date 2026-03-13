import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Escolha uma funcionalidade para continuar.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard/lost-and-found")}
            className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Achados e perdidos
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Acesse os itens encontrados e perdidos.
                </p>
              </div>

              <span className="text-sm font-medium text-zinc-300">
                Abrir módulo →
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/lost-animals")}
            className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Animais Perdidos
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Acesse os animais encontrados e perdidos.
                </p>
              </div>

              <span className="text-sm font-medium text-zinc-300">
                Abrir módulo →
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/home-rent")}
            className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Moradia</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Acesse as casas para comprar e alugar.
                </p>
              </div>

              <span className="text-sm font-medium text-zinc-300">
                Abrir módulo →
              </span>
            </div>
          </button>
        </section>
      </div>
    </main>
  );
}
