import { useEffect, useState } from "react";
import { getCurrentCommunityWarningBanners } from "@/services/supabase/warning_banners";
import type { WarningBanner } from "@/types/warning_banners";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/cache-keys";
import { getCache, isCacheExpired, setCache } from "@/lib/cache/app-cache";

export function useDashboardWarnings() {
  const [warnings, setWarnings] = useState<WarningBanner[]>(() => {
    return getCache<WarningBanner[]>(CACHE_KEYS.dashboardWarnings) ?? [];
  });

  const [loading, setLoading] = useState(() => warnings.length === 0);

  useEffect(() => {
    let active = true;

    async function load() {
      const hasCachedData = warnings.length > 0;
      const expired = isCacheExpired(CACHE_KEYS.dashboardWarnings);

      if (hasCachedData && !expired) {
        setLoading(false);
        return;
      }

      if (!hasCachedData) {
        setLoading(true);
      }

      try {
        const data = await getCurrentCommunityWarningBanners();

        if (!active) return;

        setWarnings(data);
        setCache(
          CACHE_KEYS.dashboardWarnings,
          data,
          CACHE_TTL.dashboardWarnings,
        );
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

  return {
    warnings,
    loading,
  };
}
