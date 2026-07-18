import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import DashboardHeader from "@/components/layout/DashboardHeader";
import MainLayout from "@/components/layout/MainLayout";

import {
  buildWhatsappUrl,
  deleteSponsorWeeklyAd,
  getSponsorWeeklyAd,
  saveSponsorWeeklyAd,
} from "@/services/supabase/sponsor_weekly_ad";

import type {
  SponsorAdCommunityOption,
  SponsorWeeklyAd,
} from "@/types/sponsor-weekly-ad";

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

function revokeObjectUrl(value: string) {
  if (value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
}

export default function SponsorWeeklyAdPage() {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [currentAd, setCurrentAd] = useState<SponsorWeeklyAd | null>(null);

  const [availableCommunities, setAvailableCommunities] = useState<
    SponsorAdCommunityOption[]
  >([]);

  const [community, setCommunity] = useState("");

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

  const isEditing = Boolean(currentAd);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await getSponsorWeeklyAd();

        setAvailableCommunities(response.availableCommunities ?? []);

        setCommunity(
          response.item?.community ?? response.defaultCommunity ?? "",
        );

        if (response.item) {
          const item = response.item;

          setCurrentAd(item);
          setStoreName(item.store_name);
          setPhone(item.phone);
          setValidUntil(item.valid_until);
          setImagePrimaryPreview(item.image_primary_url);
          setImageSecondaryPreview(item.image_secondary_url);
        } else {
          setCurrentAd(null);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar o encarte.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(imagePrimaryPreview);
    };
  }, [imagePrimaryPreview]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(imageSecondaryPreview);
    };
  }, [imageSecondaryPreview]);

  function handlePrimaryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setImagePrimaryFile(file);

    if (!file) {
      setImagePrimaryPreview(currentAd?.image_primary_url ?? "");

      return;
    }

    setImagePrimaryPreview(URL.createObjectURL(file));
  }

  function handleSecondaryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setImageSecondaryFile(file);

    if (!file) {
      setImageSecondaryPreview(currentAd?.image_secondary_url ?? "");

      return;
    }

    setImageSecondaryPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!community.trim()) {
      setErrorMessage("Selecione a comunidade da propaganda.");

      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveSponsorWeeklyAd({
        community,
        storeName,
        phone,
        validUntil,
        imagePrimary: imagePrimaryFile,
        imageSecondary: imageSecondaryFile,
      });

      if (response.item) {
        const item = response.item;

        setCurrentAd(item);
        setCommunity(item.community);
        setStoreName(item.store_name);
        setPhone(item.phone);
        setValidUntil(item.valid_until);
        setImagePrimaryPreview(item.image_primary_url);
        setImageSecondaryPreview(item.image_secondary_url);
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
        error instanceof Error ? error.message : "Erro ao salvar o encarte.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir o encarte publicado?",
    );

    if (!confirmed || deleting) {
      return;
    }

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

      /*
       * A comunidade permanece selecionada,
       * pois também é a comunidade padrão do
       * patrocinador.
       */
      setSuccessMessage("Encarte excluído com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao excluir o encarte.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const whatsappUrl = useMemo(() => {
    return phone ? buildWhatsappUrl(phone) : "#";
  }, [phone]);

  const selectedCommunity = useMemo(() => {
    return availableCommunities.find((item) => item.key === community) ?? null;
  }, [availableCommunities, community]);

  if (loading) {
    return (
      <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            Carregando encarte...
          </div>
        </div>
      </MainLayout>
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
          <section className="h-fit rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="weeklyAdCommunity"
                  className="mb-2 block text-sm font-medium"
                >
                  Comunidade da propaganda
                </label>

                <select
                  id="weeklyAdCommunity"
                  value={community}
                  onChange={(event) => setCommunity(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                >
                  <option value="">Selecione uma comunidade</option>

                  {availableCommunities.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  O encarte será exibido somente aos usuários da comunidade
                  selecionada.
                </p>
              </div>

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

              <div className="flex w-full flex-col items-center justify-center gap-6 text-center sm:flex-row">
                <div className="flex w-full flex-col items-center justify-center gap-2 sm:w-1/2">
                  <label htmlFor="imagePrimary">Imagem 1</label>

                  <input
                    id="imagePrimary"
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryChange}
                    className="w-full text-zinc-700 file:mr-3 file:w-full file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-emerald-500 dark:file:text-white"
                    required={!currentAd}
                  />
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-2 sm:w-1/2">
                  <label htmlFor="imageSecondary">Imagem 2</label>

                  <input
                    id="imageSecondary"
                    type="file"
                    accept="image/*"
                    onChange={handleSecondaryChange}
                    className="w-full text-zinc-700 file:mr-3 file:w-full file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-emerald-500 dark:file:text-white"
                    required={!currentAd}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
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
                    onClick={() => {
                      void handleDelete();
                    }}
                    disabled={deleting || saving}
                    className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    {deleting ? "Excluindo..." : "Excluir encarte"}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Preview</h2>

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
                Comunidade: {selectedCommunity?.label ?? "não selecionada"}
              </p>

              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
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
