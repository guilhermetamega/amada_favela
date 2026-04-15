import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  deleteSponsorStoreBanner,
  getSponsorStoreBanner,
  saveSponsorStoreBanner,
} from "@/services/supabase/sponsor_store_banner";
import type {
  SponsorStoreBanner,
  SponsorStoreBannerFeatureOption,
} from "@/types/sponsor-store-banner";

export default function SponsorBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currentBanner, setCurrentBanner] = useState<SponsorStoreBanner | null>(
    null,
  );
  const [availableFeatures, setAvailableFeatures] = useState<
    SponsorStoreBannerFeatureOption[]
  >([]);
  const [selectedFeatureKeys, setSelectedFeatureKeys] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = !!currentBanner;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await getSponsorStoreBanner();

        setAvailableFeatures(response.availableFeatures ?? []);
        setSelectedFeatureKeys(response.selectedFeatureKeys ?? []);

        if (response.item) {
          setCurrentBanner(response.item);
          setImagePreview(response.item.image_url);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar banner.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function toggleFeature(key: string) {
    setSelectedFeatureKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveSponsorStoreBanner({
        selectedFeatureKeys,
        image: imageFile,
      });

      if (response.item) {
        setCurrentBanner(response.item);
        setImagePreview(response.item.image_url);
      }

      setImageFile(null);
      setSuccessMessage(
        isEditing
          ? "Banner atualizado com sucesso."
          : "Banner publicado com sucesso.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar banner.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir o banner publicado?",
    );

    if (!confirmed || deleting) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteSponsorStoreBanner();

      setCurrentBanner(null);
      setImageFile(null);
      setImagePreview("");
      setSelectedFeatureKeys([]);
      setSuccessMessage("Banner excluído com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao excluir banner.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedFeatures = useMemo(() => {
    const selectedSet = new Set(selectedFeatureKeys);
    return availableFeatures.filter((item) => selectedSet.has(item.key));
  }, [availableFeatures, selectedFeatureKeys]);

  if (loading) {
    return (
      <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            Carregando banner...
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout className="min-h-dvh bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <DashboardHeader title="Banner da Loja" />

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
              <div className="w-full sm:flex sm:flex-col sm:items-center sm:justify-center sm:text-center">
                <div className="w-full sm:w-fit flex-col items-center justify-center gap-2 sm:flex">
                  <label htmlFor="bannerImage">Imagem do banner</label>
                  <input
                    id="bannerImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-zinc-700 file:mr-3 file:w-full file:items-center file:justify-center file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-emerald-500 dark:file:text-white"
                    required={!currentBanner}
                  />
                  <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Use uma imagem horizontal com boa leitura em mobile e
                    desktop.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-medium">
                    Função exibida ao clicar no banner
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Selecione a função que este banner representa.
                  </p>
                </div>

                <div className="space-y-3">
                  {availableFeatures.length > 0 ? (
                    availableFeatures.map((feature) => {
                      const checked = selectedFeatureKeys.includes(feature.key);

                      return (
                        <label
                          key={feature.key}
                          className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 transition ${
                            checked
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                              : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={checked}
                            onChange={() => toggleFeature(feature.key)}
                            className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <div className="flex gap-8 justify-center items-center">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {feature.label}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      Nenhuma função adicional está disponível para vincular ao
                      banner.
                    </div>
                  )}
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
                    : currentBanner
                      ? "Atualizar banner"
                      : "Publicar banner"}
                </button>

                {currentBanner ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    {deleting ? "Excluindo..." : "Excluir banner"}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
              </div>

              {currentBanner ? (
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700">
                  Publicado
                </span>
              ) : null}
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Prévia do banner da loja"
                  className="aspect-3/1 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-3/1 items-center justify-center text-sm text-zinc-500">
                  Imagem do banner
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">Funções selecionadas</h3>

              {selectedFeatures.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedFeatures.map((feature) => (
                    <span
                      key={feature.key}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {feature.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhuma função selecionada ainda.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
