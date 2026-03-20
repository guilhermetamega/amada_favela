import { useEffect, useState } from "react";
import {
  getCommunityImageSignedUrl,
  getCurrentCommunityBannerData,
} from "@/services/supabase/community_data";
import { getAssociationDisplayName } from "@/utils/communities";

const DEFAULT_DESCRIPTION = "Tecnologia para conectar a favela ao futuro";

export default function CommunityHeroCard() {
  const [loading, setLoading] = useState(true);
  const [communityName, setCommunityName] = useState("Comunidade");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);

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
            setImageUrl(signedUrl);
          } catch {
            if (!active) return;
            setImageUrl("");
          }
        } else {
          setImageUrl("");
        }
      } catch {
        if (!active) return;
        setCommunityName("Comunidade");
        setDescription(DEFAULT_DESCRIPTION);
        setImageUrl("");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-6 py-10 text-center sm:px-8 sm:py-14">
          <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="mx-auto mt-6 h-8 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mx-auto mt-3 h-5 w-56 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800">
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

      <div className="relative flex min-h-65 flex-col items-center justify-center px-6 py-10 text-center sm:min-h-80 sm:px-8 sm:py-14">
        <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white/10 shadow-2xl backdrop-blur sm:h-28 sm:w-28">
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

        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          Associação de Moradores {communityName}
        </h1>

        <p className="mt-2 text-sm text-zinc-300 sm:text-xl">{description}</p>
      </div>
    </section>
  );
}
