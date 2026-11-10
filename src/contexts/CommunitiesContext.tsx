import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDefaultCommunities,
  loadCommunitiesFromSupabase,
} from "@/lib/communities";
import type { CommunityData } from "@/types/community";
import { CommunitiesContext } from "@/contexts/communities-context";

export function CommunitiesProvider({ children }: { children: ReactNode }) {
  const [communities, setCommunities] = useState<CommunityData[]>(() =>
    getDefaultCommunities(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    let active = true;

    void loadCommunitiesFromSupabase(controller.signal)
      .then((nextCommunities) => {
        if (active) setCommunities(nextCommunities);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("[communities] Falha ao atualizar comunidades:", error);
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const value = useMemo(
    () => ({ communities, loading }),
    [communities, loading],
  );

  return (
    <CommunitiesContext.Provider value={value}>
      {children}
    </CommunitiesContext.Provider>
  );
}
