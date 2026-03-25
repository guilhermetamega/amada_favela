import { getHomeRentItemsByCommunity } from "@/services/supabase/home_rent";
import type { HomeRentItem, HomeRentState } from "@/types/home_rent";

const TTL = 1000 * 60 * 3;

const memoryMap = new Map<string, HomeRentState>();

function buildCacheKey(community: string) {
  return `home-rent:list:${community.trim().toLowerCase()}`;
}

function isFreshTimestamp(timestamp: number | null) {
  if (!timestamp) return false;
  return Date.now() - timestamp < TTL;
}

export function getHomeRentMemoryCache(community: string) {
  return memoryMap.get(buildCacheKey(community)) ?? null;
}

export function setHomeRentMemoryCache(
  community: string,
  items: HomeRentItem[],
) {
  memoryMap.set(buildCacheKey(community), {
    items,
    loadedAt: Date.now(),
  });
}

export function isHomeRentMemoryCacheFresh(community: string) {
  const state = getHomeRentMemoryCache(community);
  return isFreshTimestamp(state?.loadedAt ?? null);
}

export function getHomeRentLocalCache(community: string): HomeRentState | null {
  try {
    const raw = localStorage.getItem(buildCacheKey(community));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HomeRentState;

    if (!Array.isArray(parsed.items) || !parsed.loadedAt) {
      return null;
    }

    if (!isFreshTimestamp(parsed.loadedAt)) {
      localStorage.removeItem(buildCacheKey(community));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setHomeRentLocalCache(
  community: string,
  items: HomeRentItem[],
) {
  try {
    const payload: HomeRentState = {
      items,
      loadedAt: Date.now(),
    };

    localStorage.setItem(buildCacheKey(community), JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function hydrateHomeRentCache(community: string, items: HomeRentItem[]) {
  setHomeRentMemoryCache(community, items);
  setHomeRentLocalCache(community, items);
}

export function clearHomeRentCache(community?: string) {
  if (community) {
    const key = buildCacheKey(community);
    memoryMap.delete(key);

    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }

    return;
  }

  memoryMap.clear();
}

export async function revalidateHomeRentCache(community: string) {
  const items = await getHomeRentItemsByCommunity(community);
  hydrateHomeRentCache(community, items);
  preloadHomeRentImages(items);
  return items;
}

export async function getHomeRentCached(community: string) {
  const memory = getHomeRentMemoryCache(community);

  if (memory && isFreshTimestamp(memory.loadedAt)) {
    return {
      items: memory.items,
      source: "memory" as const,
    };
  }

  const local = getHomeRentLocalCache(community);
  if (local) {
    memoryMap.set(buildCacheKey(community), local);

    return {
      items: local.items,
      source: "local" as const,
    };
  }

  const items = await revalidateHomeRentCache(community);

  return {
    items,
    source: "network" as const,
  };
}

export function preloadHomeRentImages(items: HomeRentItem[], limit = 8) {
  items.slice(0, limit).forEach((item) => {
    [item.pic_1_url, item.pic_2_url, item.pic_3_url]
      .filter(Boolean)
      .forEach((src) => {
        const image = new Image();
        image.src = src as string;
      });
  });
}
