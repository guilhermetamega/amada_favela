import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  buildWhatsappUrl,
  deleteSponsorWeeklyAd,
  getSponsorWeeklyAd,
  saveSponsorWeeklyAd,
} from "@/services/supabase/sponsor_weekly_ad";
import type { SponsorWeeklyAd } from "@/types/sponsor-weekly-ad";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function SponsorWeeklyAdPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currentAd, setCurrentAd] = useState<SponsorWeeklyAd | null>(null);

  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [imagePrimaryFile, setImagePrimaryFile] = useState<File | null>(null);
  const [imageSecondaryFile, setImageSecondaryFile] = useState<File | null>(
    null,
  );

  const [imagePrimaryPreview, setImagePrimaryPreview] = useState("");
  const [imageSecondaryPreview, setImageSecondaryPreview] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = !!currentAd;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await getSponsorWeeklyAd();

        if (response.item) {
          const item = response.item;

          setCurrentAd(item);
          setStoreName(item.store_name);
          setPhone(item.phone);
          setValidUntil(item.valid_until);
          setImagePrimaryPreview(item.image_primary_url);
          setImageSecondaryPreview(item.image_secondary_url);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar encarte.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function handlePrimaryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImagePrimaryFile(file);
    if (file) {
      setImagePrimaryPreview(URL.createObjectURL(file));
    }
  }

  function handleSecondaryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageSecondaryFile(file);
    if (file) {
      setImageSecondaryPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveSponsorWeeklyAd({
        storeName,
        phone,
        validUntil,
        imagePrimary: imagePrimaryFile,
        imageSecondary: imageSecondaryFile,
      });

      if (response.item) {
        setCurrentAd(response.item);
        setStoreName(response.item.store_name);
        setPhone(response.item.phone);
        setValidUntil(response.item.valid_until);
        setImagePrimaryPreview(response.item.image_primary_url);
        setImageSecondaryPreview(response.item.image_secondary_url);
        setImagePrimaryFile(null);
        setImageSecondaryFile(null);
      }

      setSuccessMessage(
        isEditing
          ? "Encarte atualizado com sucesso."
          : "Encarte publicado com sucesso.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar encarte.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir o encarte publicado?",
    );

    if (!confirmed || deleting) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteSponsorWeeklyAd();

      setCurrentAd(null);
      setStoreName("");
      setPhone("");
      setValidUntil("");
      setImagePrimaryFile(null);
      setImageSecondaryFile(null);
      setImagePrimaryPreview("");
      setImageSecondaryPreview("");
      setSuccessMessage("Encarte excluído com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao excluir encarte.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const whatsappUrl = useMemo(() => {
    return phone ? buildWhatsappUrl(phone) : "#";
  }, [phone]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            Carregando encarte...
          </div>
        </div>
      </main>
    );
  }

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <DashboardHeader title="Encarte" />

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="storeName"
                  className="mb-2 block text-sm font-medium"
                >
                  Nome da loja
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium"
                >
                  WhatsApp / Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(21) 99999-9999"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="validUntil"
                  className="mb-2 block text-sm font-medium"
                >
                  Validade do encarte
                </label>
                <input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div className="w-full flex justify-center items-center text-center gap-4 sm:flex">
                <div className="w-full flex-col text-center justify-center items-center gap-2 sm:flex">
                  <label htmlFor="imagePrimary" className="">
                    Imagem 1
                  </label>
                  <input
                    id="imagePrimary"
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryChange}
                    className="file:w-full file:flex file:justify-center file:items-center text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-emerald-500 dark:file:text-white"
                    required={!currentAd}
                  />
                </div>

                <div className="w-full flex-col text-center justify-center items-center gap-2 sm:flex">
                  <label htmlFor="imagePrimary" className="">
                    Imagem 2
                  </label>
                  <input
                    id="imagePrimary"
                    type="file"
                    accept="image/*"
                    onChange={handleSecondaryChange}
                    className="file:w-full file:flex file:justify-center file:items-center text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-emerald-500 dark:file:text-white"
                    required={!currentAd}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                  {saving
                    ? "Salvando..."
                    : currentAd
                      ? "Atualizar encarte"
                      : "Publicar encarte"}
                </button>

                {currentAd ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    {deleting ? "Excluindo..." : "Excluir encarte"}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Visualização do que será publicado.
                </p>
              </div>

              {currentAd ? (
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700">
                  Publicado
                </span>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {imagePrimaryPreview ? (
                  <img
                    src={imagePrimaryPreview}
                    alt="Prévia da imagem principal do encarte"
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-4/5 items-center justify-center text-sm text-zinc-500">
                    Imagem 1
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {imageSecondaryPreview ? (
                  <img
                    src={imageSecondaryPreview}
                    alt="Prévia da imagem secundária do encarte"
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-4/5 items-center justify-center text-sm text-zinc-500">
                    Imagem 2
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">
                {storeName || "Nome da loja"}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                WhatsApp: {phone || "não informado"}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Validade:{" "}
                {validUntil ? formatDate(validUntil) : "não informada"}
              </p>

              <a
                href={phone ? whatsappUrl : undefined}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-flex rounded-2xl px-4 py-2 font-medium ${
                  phone
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "pointer-events-none border border-zinc-200 text-zinc-400 dark:border-zinc-800"
                }`}
              >
                Ir para o WhatsApp
              </a>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
