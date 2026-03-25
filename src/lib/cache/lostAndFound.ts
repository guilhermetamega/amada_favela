import { getLostAndFoundItemsByCommunity } from "@/services/supabase/lost_and_found";
import type {
  LostAndFoundItem,
  LostAndFoundState,
} from "@/types/lost_and_found";

const TTL = 1000 * 60 * 3;

const memoryMap = new Map<string, LostAndFoundState>();

function buildCacheKey(community: string) {
  return `lost-and-found:list:${community.trim().toLowerCase()}`;
}

function isFreshTimestamp(timestamp: number | null) {
  if (!timestamp) return false;
  return Date.now() - timestamp < TTL;
}

export function getLostAndFoundMemoryCache(community: string) {
  return memoryMap.get(buildCacheKey(community)) ?? null;
}

export function setLostAndFoundMemoryCache(
  community: string,
  items: LostAndFoundItem[],
) {
  memoryMap.set(buildCacheKey(community), {
    items,
    loadedAt: Date.now(),
  });
}

export function getLostAndFoundLocalCache(
  community: string,
): LostAndFoundState | null {
  try {
    const raw = localStorage.getItem(buildCacheKey(community));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LostAndFoundState;

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

export function setLostAndFoundLocalCache(
  community: string,
  items: LostAndFoundItem[],
) {
  try {
    const payload: LostAndFoundState = {
      items,
      loadedAt: Date.now(),
    };

    localStorage.setItem(buildCacheKey(community), JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function hydrateLostAndFoundCache(
  community: string,
  items: LostAndFoundItem[],
) {
  setLostAndFoundMemoryCache(community, items);
  setLostAndFoundLocalCache(community, items);
}

export function clearLostAndFoundCache(community?: string) {
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

export async function revalidateLostAndFoundCache(community: string) {
  const items = await getLostAndFoundItemsByCommunity(community);
  hydrateLostAndFoundCache(community, items);
  preloadLostAndFoundImages(items);
  return items;
}

export async function getLostAndFoundCached(community: string) {
  const memory = getLostAndFoundMemoryCache(community);

  if (memory && isFreshTimestamp(memory.loadedAt)) {
    return {
      items: memory.items,
      source: "memory" as const,
    };
  }

  const local = getLostAndFoundLocalCache(community);
  if (local) {
    memoryMap.set(buildCacheKey(community), local);

    return {
      items: local.items,
      source: "local" as const,
    };
  }

  const items = await revalidateLostAndFoundCache(community);

  return {
    items,
    source: "network" as const,
  };
}

export function preloadLostAndFoundImages(
  items: LostAndFoundItem[],
  limit = 8,
) {
  items.slice(0, limit).forEach((item) => {
    [item.pic_1_url, item.pic_2_url, item.pic_3_url]
      .filter(Boolean)
      .forEach((src) => {
        const image = new Image();
        image.src = src as string;
      });
  });
}
