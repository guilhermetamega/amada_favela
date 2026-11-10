import type { Poll } from "@/types/polls";

const POLLS_CACHE_PREFIX = "polls:list:";
const ADMIN_POLLS_CACHE_PREFIX = "polls:admin:list:";
const TTL_MS = 1000 * 60 * 5;

type CachePayload = {
  expiresAt: number;
  value: Poll[];
};

function read(key: string): Poll[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachePayload;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function write(key: string, value: Poll[]) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: Date.now() + TTL_MS,
        value,
      }),
    );
  } catch {
    // noop
  }
}

function getScopedKey(prefix: string, userId: string) {
  return `${prefix}${userId}`;
}

export function readPollsCache(userId: string) {
  return read(getScopedKey(POLLS_CACHE_PREFIX, userId));
}

export function writePollsCache(userId: string, value: Poll[]) {
  write(getScopedKey(POLLS_CACHE_PREFIX, userId), value);
}

export function readAdminPollsCache(userId: string) {
  return read(getScopedKey(ADMIN_POLLS_CACHE_PREFIX, userId));
}

export function writeAdminPollsCache(userId: string, value: Poll[]) {
  write(getScopedKey(ADMIN_POLLS_CACHE_PREFIX, userId), value);
}

export function invalidatePollsCache() {
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (
      key &&
      (key.startsWith(POLLS_CACHE_PREFIX) ||
        key.startsWith(ADMIN_POLLS_CACHE_PREFIX) ||
        key === "polls:list" ||
        key === "polls:admin:list")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
