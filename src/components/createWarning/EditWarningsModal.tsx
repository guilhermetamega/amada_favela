import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, LoaderCircle, Pencil, TimerReset, X } from "lucide-react";
import warningBg from "@/assets/warning_bg.png";
import type { WarningBanner } from "@/types/warning_banners";

type Props = {
  open: boolean;
  items: WarningBanner[];
  loadingList: boolean;
  saving: boolean;
  errorMessage: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSave: (
    bannerId: string,
    input: {
      message: string;
      text_color: string;
      expires_at: string;
    },
  ) => Promise<void>;
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function EditWarningsModal({
  open,
  items,
  loadingList,
  saving,
  errorMessage,
  onClose,
  onRefresh,
  onSave,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [expiresAt, setExpiresAt] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const selectedBanner = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!open) return;

    if (!selectedId && items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(items[0].id);
    }
  }, [open, items, selectedId]);

  useEffect(() => {
    if (!selectedBanner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage("");
      setTextColor("#ffffff");
      setExpiresAt("");
      return;
    }

    setMessage(selectedBanner.message ?? "");
    setTextColor(selectedBanner.text_color ?? "#ffffff");
    setExpiresAt(toDateTimeLocal(selectedBanner.expires_at));
  }, [selectedBanner]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMobileListOpen(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBanner || saving) return;

    await onSave(selectedBanner.id, {
      message: message.trim(),
      text_color: textColor,
      expires_at: new Date(expiresAt).toISOString(),
    });
  }

  function handleSelectBanner(bannerId: string) {
    setSelectedId(bannerId);
    setMobileListOpen(false);
  }

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative border-b border-zinc-200 px-4 py-5 dark:border-zinc-800 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>

            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                Editar comunicados ativos
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Selecione um banner ativo da sua comunidade para editar.
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="hidden border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 xl:block xl:border-b-0 xl:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  Banners ativos
                </h3>

                <button
                  type="button"
                  onClick={() => void onRefresh()}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Atualizar
                </button>
              </div>

              {loadingList ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Carregando banners...
                </div>
              ) : null}

              {!loadingList && items.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Nenhum banner ativo disponível para edição.
                </div>
              ) : null}

              {!loadingList && items.length > 0 ? (
                <div className="space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectBanner(item.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.message}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Expira em {formatDate(item.expires_at)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </aside>

            <div className="overflow-y-auto p-4 sm:p-5">
              <section className="mb-4 xl:hidden">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setMobileListOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Banner selecionado
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedBanner?.message || "Selecione um banner"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedBanner
                          ? `Expira em ${formatDate(selectedBanner.expires_at)}`
                          : items.length > 0
                            ? `${items.length} banners disponíveis`
                            : "Nenhum banner disponível"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {items.length > 1 ? (
                        <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                          +{items.length - 1}
                        </span>
                      ) : null}

                      <span
                        className={`rounded-2xl border border-zinc-200 p-2 text-zinc-600 transition dark:border-zinc-700 dark:text-zinc-300 ${
                          mobileListOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </div>
                  </button>

                  {mobileListOpen ? (
                    <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
                      <div className="mb-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => void onRefresh()}
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Atualizar
                        </button>
                      </div>

                      {loadingList ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          Carregando banners...
                        </div>
                      ) : null}

                      {!loadingList && items.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          Nenhum banner ativo disponível para edição.
                        </div>
                      ) : null}

                      {!loadingList && items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map((item) => {
                            const isActive = item.id === selectedId;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectBanner(item.id)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                  isActive
                                    ? "border-violet-500 bg-violet-500/10"
                                    : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                }`}
                              >
                                <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.message}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  Expira em {formatDate(item.expires_at)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              {errorMessage ? (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              {!selectedBanner && !loadingList ? (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  Selecione um banner para editar.
                </div>
              ) : null}

              {selectedBanner ? (
                <div className="space-y-4">
                  <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Pré-visualização
                      </h3>
                    </div>

                    <div className="p-4 sm:p-5">
                      <article
                        className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800"
                        style={{
                          backgroundImage: `url(${warningBg})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/85" />

                        <div className="relative px-5 py-8 text-center sm:px-6 sm:py-10">
                          <p
                            className="text-lg font-semibold leading-relaxed sm:text-xl md:text-2xl"
                            style={{ color: textColor }}
                          >
                            {message.trim() || "Seu comunicado aparecerá aqui."}
                          </p>
                        </div>
                      </article>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Editar banner
                      </h3>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="space-y-5 p-4 sm:p-5"
                    >
                      <div>
                        <label
                          htmlFor="edit-warning-message"
                          className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <Pencil size={16} />
                          Texto do comunicado
                        </label>

                        <textarea
                          id="edit-warning-message"
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          rows={6}
                          maxLength={220}
                          className="min-h-36 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
                        <div>
                          <label
                            htmlFor="edit-warning-color"
                            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Cor
                          </label>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950">
                            <input
                              id="edit-warning-color"
                              type="color"
                              value={textColor}
                              onChange={(event) =>
                                setTextColor(event.target.value)
                              }
                              className="h-12 w-full cursor-pointer rounded-xl border-0 bg-transparent p-0"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="edit-warning-expires-at"
                            className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            <TimerReset size={16} />
                            Data de expiração
                          </label>

                          <input
                            id="edit-warning-expires-at"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(event) =>
                              setExpiresAt(event.target.value)
                            }
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : (
                            <Pencil size={16} />
                          )}
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
