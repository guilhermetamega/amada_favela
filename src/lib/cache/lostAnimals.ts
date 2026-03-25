import { getLostAnimalsItemsByCommunity } from "@/services/supabase/lost_animals";
import type { LostAnimalsItem, LostAnimalsState } from "@/types/lost_animals";

const TTL = 1000 * 60 * 3;

const memoryMap = new Map<string, LostAnimalsState>();

function buildCacheKey(community: string) {
  return `lost-animals:list:${community.trim().toLowerCase()}`;
}

function isFreshTimestamp(timestamp: number | null) {
  if (!timestamp) return false;
  return Date.now() - timestamp < TTL;
}

export function getLostAnimalsMemoryCache(community: string) {
  return memoryMap.get(buildCacheKey(community)) ?? null;
}

export function setLostAnimalsMemoryCache(
  community: string,
  items: LostAnimalsItem[],
) {
  memoryMap.set(buildCacheKey(community), {
    items,
    loadedAt: Date.now(),
  });
}

export function getLostAnimalsLocalCache(
  community: string,
): LostAnimalsState | null {
  try {
    const raw = localStorage.getItem(buildCacheKey(community));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LostAnimalsState;

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

export function setLostAnimalsLocalCache(
  community: string,
  items: LostAnimalsItem[],
) {
  try {
    const payload: LostAnimalsState = {
      items,
      loadedAt: Date.now(),
    };

    localStorage.setItem(buildCacheKey(community), JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function hydrateLostAnimalsCache(
  community: string,
  items: LostAnimalsItem[],
) {
  setLostAnimalsMemoryCache(community, items);
  setLostAnimalsLocalCache(community, items);
}

export function clearLostAnimalsCache(community?: string) {
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

export async function revalidateLostAnimalsCache(community: string) {
  const items = await getLostAnimalsItemsByCommunity(community);
  hydrateLostAnimalsCache(community, items);
  preloadLostAnimalsImages(items);
  return items;
}

export async function getLostAnimalsCached(community: string) {
  const memory = getLostAnimalsMemoryCache(community);

  if (memory && isFreshTimestamp(memory.loadedAt)) {
    return {
      items: memory.items,
      source: "memory" as const,
    };
  }

  const local = getLostAnimalsLocalCache(community);
  if (local) {
    memoryMap.set(buildCacheKey(community), local);

    return {
      items: local.items,
      source: "local" as const,
    };
  }

  const items = await revalidateLostAnimalsCache(community);

  return {
    items,
    source: "network" as const,
  };
}

export function preloadLostAnimalsImages(items: LostAnimalsItem[], limit = 8) {
  items.slice(0, limit).forEach((item) => {
    [item.pic_1_url, item.pic_2_url, item.pic_3_url]
      .filter(Boolean)
      .forEach((src) => {
        const image = new Image();
        image.src = src as string;
      });
  });
}
