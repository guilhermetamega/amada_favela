import { useEffect, useState } from "react";
import { getAssociationPublicData } from "@/services/supabase/association";
import { getCache, setCache, isCacheExpired } from "@/lib/cache/app-cache";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/cache-keys";

export type AssociationHeroData = {
  name: string;
  community: string;
  description?: string | null;
  logo_url: string | null;
  banner_url: string | null;
};

export function useAssociationHero() {
  const [data, setData] = useState<AssociationHeroData | null>(() => {
    return getCache<AssociationHeroData>(CACHE_KEYS.associationHero);
  });

  const [loading, setLoading] = useState(() => !data);

  useEffect(() => {
    let active = true;

    async function load() {
      const expired = isCacheExpired(CACHE_KEYS.associationHero);

      // ⚠️ NÃO LIMPA O DATA
      if (!expired && data) {
        setLoading(false);
        return;
      }

      try {
        const result = await getAssociationPublicData();

        if (!active) return;

        setData(result);
        setCache(CACHE_KEYS.associationHero, result, CACHE_TTL.associationHero);
      } catch {
        if (!active) return;
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (!active) return;
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading };
}
