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
  deleteSponsorStoreBanner,
  getSponsorStoreBanner,
  saveSponsorStoreBanner,
} from "@/services/supabase/sponsor_store_banner";

import type {
  SponsorAdCommunityOption,
  SponsorStoreBanner,
  SponsorStoreBannerFeatureOption,
} from "@/types/sponsor-store-banner";

function revokeObjectUrl(value: string) {
  if (value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
}

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

  const [availableCommunities, setAvailableCommunities] = useState<
    SponsorAdCommunityOption[]
  >([]);

  const [community, setCommunity] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = Boolean(currentBanner);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await getSponsorStoreBanner();

        setAvailableFeatures(response.availableFeatures ?? []);

        setSelectedFeatureKeys(response.selectedFeatureKeys ?? []);

        setAvailableCommunities(response.availableCommunities ?? []);

        const initialCommunity =
          response.item?.community ?? response.defaultCommunity ?? "";

        setCommunity(initialCommunity);

        if (response.item) {
          setCurrentBanner(response.item);

          setImagePreview(response.item.image_url);
        } else {
          setCurrentBanner(null);
          setImagePreview("");
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar o banner.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setImageFile(file);

    if (!file) {
      setImagePreview(currentBanner?.image_url ?? "");

      return;
    }

    setImagePreview(URL.createObjectURL(file));
  }

  function selectFeature(key: string) {
    /*
     * O banner representa uma única função.
     * O backend mantém array porque a tabela
     * relacional aceita vários vínculos.
     */
    setSelectedFeatureKeys([key]);
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

    if (selectedFeatureKeys.length === 0) {
      setErrorMessage("Selecione a função exibida ao clicar no banner.");

      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveSponsorStoreBanner({
        community,
        selectedFeatureKeys,
        image: imageFile,
      });

      if (response.item) {
        setCurrentBanner(response.item);

        setCommunity(response.item.community);

        setImagePreview(response.item.image_url);
      }

      if (response.selectedFeatureKeys) {
        setSelectedFeatureKeys(response.selectedFeatureKeys);
      }

      setImageFile(null);

      setSuccessMessage(
        isEditing
          ? "Banner atualizado com sucesso."
          : "Banner publicado com sucesso.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar o banner.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir o banner publicado?",
    );

    if (!confirmed || deleting) {
      return;
    }

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
        error instanceof Error ? error.message : "Erro ao excluir o banner.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedFeatures = useMemo(() => {
    const selectedSet = new Set(selectedFeatureKeys);

    return availableFeatures.filter((item) => selectedSet.has(item.key));
  }, [availableFeatures, selectedFeatureKeys]);

  const selectedCommunity = useMemo(() => {
    return availableCommunities.find((item) => item.key === community) ?? null;
  }, [availableCommunities, community]);

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
              <div>
                <label
                  htmlFor="bannerCommunity"
                  className="mb-2 block text-sm font-medium"
                >
                  Comunidade da propaganda
                </label>

                <select
                  id="bannerCommunity"
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
                  O banner será exibido somente aos usuários da comunidade
                  selecionada.
                </p>
              </div>

              <div className="w-full sm:flex sm:flex-col sm:items-center sm:justify-center sm:text-center">
                <div className="w-full flex-col items-center justify-center gap-2 sm:flex sm:w-fit">
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
                            name="bannerFeature"
                            checked={checked}
                            onChange={() => selectFeature(feature.key)}
                            className="size-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {feature.label}
                            </p>

                            {feature.description ? (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {feature.description}
                              </p>
                            ) : null}
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
                  disabled={saving || deleting}
                  className="rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
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
                    onClick={() => {
                      void handleDelete();
                    }}
                    disabled={deleting || saving}
                    className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    {deleting ? "Excluindo..." : "Excluir banner"}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Preview</h2>

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
              <h3 className="text-lg font-semibold">Comunidade</h3>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {selectedCommunity?.label ?? "Nenhuma comunidade selecionada."}
              </p>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">Função selecionada</h3>

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
