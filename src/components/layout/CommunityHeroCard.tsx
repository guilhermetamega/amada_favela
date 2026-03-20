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
      <section className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-4 py-5 text-center sm:px-6 sm:py-6">
          <div className="mx-auto h-17 w-17 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800 sm:h-20 sm:w-20" />
          <div className="mx-auto mt-4 h-6 w-56 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:h-7 sm:w-80" />
          <div className="mx-auto mt-2 h-4 w-44 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:h-5 sm:w-56" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-black shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] dark:border-zinc-800">
      <style>
        {`
          @keyframes communityGradientShift {
            0% {
              transform: translate3d(-8%, -6%, 0) scale(1);
            }
            50% {
              transform: translate3d(8%, 6%, 0) scale(1.06);
            }
            100% {
              transform: translate3d(-8%, -6%, 0) scale(1);
            }
          }
        `}
      </style>

      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Logo da associação ${communityName}`}
            className="h-full w-full scale-110 object-cover opacity-[0.14] blur-[2px]"
          />
        ) : (
          <div className="h-full w-full bg-black" />
        )}
      </div>

      <div className="absolute inset-0 bg-black/50" />

      <div
        className="absolute -inset-[18%] opacity-80"
        style={{
          background:
            "radial-gradient(circle at 12% 20%, rgba(59,130,246,0.70), transparent 34%), radial-gradient(circle at 84% 24%, rgba(168,85,247,0.7), transparent 34%), radial-gradient(circle at 52% 88%, rgba(16,185,129,0.5), transparent 28%), linear-gradient(135deg, rgba(24,24,27,0.7), rgba(9,9,11,0.75))",
          animation: "communityGradientShift 14s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-0 bg-linear-to-r from-black/45 via-black/25 to-black/45" />
      <div className="absolute inset-0 bg-linear-to-b from-white/5 to-black/20" />

      <div className="relative flex min-h-37 items-center gap-3 px-4 py-4 sm:min-h-42.5 sm:gap-5 sm:px-6 sm:py-5 lg:min-h-45.5 lg:px-7">
        <div className="flex shrink-0 items-center justify-center">
          <div className="flex h-17 w-17 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white/10 shadow-2xl ring-1 ring-white/10 backdrop-blur sm:h-21 sm:w-21 lg:h-23 lg:w-23">
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
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-300 sm:text-[0.72rem]">
            Associação de Moradores
          </p>

          <h1 className="truncate text-lg font-extrabold tracking-tight text-white sm:text-2xl lg:text-[2rem]">
            {communityName}
          </h1>

          <p className="mt-1 line-clamp-2 max-w-3xl text-[0.78rem] leading-5 text-zinc-200 sm:mt-2 sm:text-sm sm:leading-6 lg:text-base">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
