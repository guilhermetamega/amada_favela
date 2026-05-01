import type {
  MyListingsData,
  PartnerHistoryItem,
  ProfileUser,
} from "@/types/profile";

export type ProfilePageCachePayload = {
  profile: ProfileUser;
  partnerHistory: PartnerHistoryItem[];
  listings: MyListingsData;
  avatarUrl: string | null;
  timestamp: number;
};

const PROFILE_CACHE_KEY = "profile_page_cache_v2";
const PROFILE_CACHE_TTL = 1000 * 60 * 10;

let memoryCache: ProfilePageCachePayload | null = null;

export function getProfileCache(): ProfilePageCachePayload | null {
  if (memoryCache) {
    const expired = Date.now() - memoryCache.timestamp > PROFILE_CACHE_TTL;
    if (!expired) return memoryCache;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProfilePageCachePayload;
    const expired = Date.now() - parsed.timestamp > PROFILE_CACHE_TTL;

    if (expired) {
      window.sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfileCache(
  payload: Omit<ProfilePageCachePayload, "timestamp">,
) {
  const next: ProfilePageCachePayload = {
    ...payload,
    timestamp: Date.now(),
  };

  memoryCache = next;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export function clearProfileCache() {
  memoryCache = null;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // noop
  }
}
