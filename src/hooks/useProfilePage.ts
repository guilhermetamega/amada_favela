import { useEffect, useMemo, useState } from "react";
import {
  getMyAvatarSignedUrl,
  getMyListings,
  getMyPartnerHistory,
  getMyProfile,
} from "@/services/supabase/user_profile";
import type {
  MyListingsData,
  PartnerHistoryItem,
  ProfileUser,
} from "@/types/profile";
import { getProfileCache, saveProfileCache } from "@/lib/cache/profile-cache";

type State = {
  profile: ProfileUser | null;
  partnerHistory: PartnerHistoryItem[];
  listings: MyListingsData;
  avatarUrl: string | null;
};

const EMPTY_LISTINGS: MyListingsData = {
  lostAnimals: [],
  lostAndFound: [],
  homeRent: [],
};

export function useProfilePage() {
  const cached = getProfileCache();

  const [state, setState] = useState<State>(() => ({
    profile: cached?.profile ?? null,
    partnerHistory: cached?.partnerHistory ?? [],
    listings: cached?.listings ?? EMPTY_LISTINGS,
    avatarUrl: cached?.avatarUrl ?? null,
  }));

  const [loading, setLoading] = useState(() => !cached);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profile, partnerHistory, listings] = await Promise.all([
          getMyProfile(),
          getMyPartnerHistory(),
          getMyListings(),
        ]);

        let avatarUrl = state.avatarUrl;

        if (profile.picture_path) {
          try {
            avatarUrl = await getMyAvatarSignedUrl(profile.picture_path);
          } catch {
            avatarUrl = null;
          }
        } else {
          avatarUrl = null;
        }

        if (!active) return;

        const next = {
          profile,
          partnerHistory,
          listings,
          avatarUrl,
        };

        setState(next);
        saveProfileCache(next);
        setErrorMessage("");
      } catch (error) {
        if (!active) return;

        if (!cached) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Erro ao carregar o perfil.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = useMemo(() => !!state.profile, [state.profile]);

  return {
    ...state,
    loading,
    hasData,
    errorMessage,
    setState,
  };
}
