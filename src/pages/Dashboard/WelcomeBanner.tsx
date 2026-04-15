import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
  getCommunityImageSignedUrl,
  getCurrentCommunityBannerData,
  upsertCurrentCommunityData,
} from "@/services/supabase/community_data";
import { getAssociationDisplayName } from "@/utils/communities";
import MainLayout from "@/components/layout/MainLayout";

const DEFAULT_DESCRIPTION = "Tecnologia para conectar a favela ao futuro";

export default function WelcomeBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [communityName, setCommunityName] = useState("Comunidade");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [persistedImageUrl, setPersistedImageUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { profile, communityData } =
          await getCurrentCommunityBannerData();

        if (!active) return;

        setCommunityName(getAssociationDisplayName(profile.comunity));
        setDescription(
          communityData?.description?.trim() || DEFAULT_DESCRIPTION,
        );

        if (communityData?.picture_path) {
          try {
            const signedUrl = await getCommunityImageSignedUrl(
              communityData.picture_path,
            );

            if (!active) return;
            setPersistedImageUrl(signedUrl);
          } catch {
            if (!active) return;
            setPersistedImageUrl("");
          }
        } else {
          setPersistedImageUrl("");
        }
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Erro ao carregar banner.";
        setErrorMessage(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      active = false;
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setSuccessMessage("");

    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
    }

    if (file) {
      setPreviewFileUrl(URL.createObjectURL(file));
      return;
    }

    setPreviewFileUrl("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await upsertCurrentCommunityData({
        description,
        pictureFile: imageFile,
      });

      if (data.picture_path) {
        const signedUrl = await getCommunityImageSignedUrl(data.picture_path);
        setPersistedImageUrl(signedUrl);
      } else {
        setPersistedImageUrl("");
      }

      setImageFile(null);

      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
      }

      setPreviewFileUrl("");
      setSuccessMessage("Banner da associação atualizado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar banner.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  const imageUrl = previewFileUrl || persistedImageUrl;

  if (loading) {
    return (
      <DashboardLayout>
        <MainLayout>
          <div className="mx-auto max-w-7xl">
            <DashboardHeader title="" />
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-10 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-6 h-80 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </MainLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl">
          <DashboardHeader title="Editar banner de boas-vindas" />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="communityName"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Comunidade
                  </label>
                  <input
                    id="communityName"
                    value={communityName}
                    disabled
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    maxLength={120}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500"
                    placeholder={DEFAULT_DESCRIPTION}
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Até 120 caracteres. Exibido abaixo do título.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="logo"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Logo da associação
                  </label>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Use imagem quadrada para melhor resultado no círculo.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Preview
                </h2>

                <div className="mt-4">
                  <HeroPreview
                    mode="desktop"
                    communityName={communityName}
                    description={description.trim() || DEFAULT_DESCRIPTION}
                    imageUrl={imageUrl}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}

type HeroPreviewProps = {
  mode: "mobile" | "desktop";
  communityName: string;
  description: string;
  imageUrl: string;
};

function HeroPreview({
  mode,
  communityName,
  description,
  imageUrl,
}: HeroPreviewProps) {
  const isMobile = mode === "mobile";

  return (
    <section
      className={[
        "relative overflow-hidden border bg-black",
        isMobile ? "min-h-62.5 rounded-3xl" : "min-h-80 rounded-3xl",
      ].join(" ")}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Logo da associação ${communityName}`}
            className="h-full w-full object-cover opacity-30"
          />
        ) : (
          <div className="h-full w-full bg-black" />
        )}
      </div>

      <div className="absolute inset-0 bg-black/70" />

      <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
        <div
          className={[
            "mb-4 flex items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white/10 shadow-2xl backdrop-blur",
            isMobile ? "h-20 w-20" : "h-28 w-28",
          ].join(" ")}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Logo da associação ${communityName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-zinc-800" />
          )}
        </div>

        <h3
          className={[
            "font-extrabold tracking-tight text-white",
            isMobile ? "text-xl" : "text-4xl",
          ].join(" ")}
        >
          Associação de Moradores {communityName}
        </h3>

        <p
          className={[
            "mt-2 text-zinc-300",
            isMobile ? "text-sm" : "text-xl",
          ].join(" ")}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
