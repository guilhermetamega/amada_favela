import { useState, type FormEvent } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { createWarningBanner } from "@/services/supabase/warning_banners";
import warningBg from "@/assets/warning_bg.png";

export default function CreateWarningsPage() {
  const [message, setMessage] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!expiresAt) {
      setErrorMessage("Selecione a data de expiração do banner.");
      return;
    }

    setLoading(true);

    try {
      await createWarningBanner({
        message,
        text_color: textColor,
        expires_at: new Date(expiresAt).toISOString(),
      });

      setMessage("");
      setTextColor("#ffffff");
      setExpiresAt("");
      setSuccessMessage("Comunicado publicado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao publicar comunicado.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <DashboardHeader
            title="Criar Comunicado"
            description="Publique banners de aviso para a sua comunidade."
            showBackButton
          />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="message"
                  >
                    Texto do comunicado
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                    required
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="textColor"
                  >
                    Cor do texto
                  </label>
                  <input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2"
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm text-zinc-300"
                    htmlFor="expiresAt"
                  >
                    Data de expiração
                  </label>
                  <input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-zinc-900 disabled:opacity-60"
                >
                  {loading ? "Publicando..." : "Publicar comunicado"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Preview</h2>

              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm text-zinc-400">Mobile</p>
                  <div
                    className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800"
                    style={{
                      backgroundImage: `url(${warningBg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/80" />
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <p
                        className="text-lg font-semibold"
                        style={{ color: textColor }}
                      >
                        {message || "Seu comunicado aparecerá aqui"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-400">Desktop</p>
                  <div
                    className="relative aspect-[16/6] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800"
                    style={{
                      backgroundImage: `url(${warningBg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/80" />
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                      <p
                        className="text-2xl font-semibold"
                        style={{ color: textColor }}
                      >
                        {message || "Seu comunicado aparecerá aqui"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
