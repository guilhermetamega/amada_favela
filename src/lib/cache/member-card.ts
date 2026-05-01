import type { MemberCardData } from "@/types/member_card";

export type MemberCardCachePayload = {
  cardData: MemberCardData;
  timestamp: number;
};

const MEMBER_CARD_CACHE_KEY = "member_card_cache_v1";
const MEMBER_CARD_CACHE_TTL = 1000 * 60 * 5;

let memoryCache: MemberCardCachePayload | null = null;

function isExpired(timestamp: number) {
  return Date.now() - timestamp > MEMBER_CARD_CACHE_TTL;
}

export function getMemberCardCache(): MemberCardCachePayload | null {
  if (memoryCache && !isExpired(memoryCache.timestamp)) {
    return memoryCache;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(MEMBER_CARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MemberCardCachePayload;

    if (!parsed?.timestamp || !parsed?.cardData || isExpired(parsed.timestamp)) {
      window.sessionStorage.removeItem(MEMBER_CARD_CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMemberCardCache(cardData: MemberCardData) {
  const payload: MemberCardCachePayload = {
    cardData,
    timestamp: Date.now(),
  };

  memoryCache = payload;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(MEMBER_CARD_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function clearMemberCardCache() {
  memoryCache = null;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(MEMBER_CARD_CACHE_KEY);
  } catch {
    // noop
  }
}
