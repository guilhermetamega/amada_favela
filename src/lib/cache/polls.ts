import type { Poll } from "@/types/polls";

const POLLS_CACHE_KEY = "polls:list";
const ADMIN_POLLS_CACHE_KEY = "polls:admin:list";
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

export function readPollsCache() {
  return read(POLLS_CACHE_KEY);
}

export function writePollsCache(value: Poll[]) {
  write(POLLS_CACHE_KEY, value);
}

export function readAdminPollsCache() {
  return read(ADMIN_POLLS_CACHE_KEY);
}

export function writeAdminPollsCache(value: Poll[]) {
  write(ADMIN_POLLS_CACHE_KEY, value);
}

export function invalidatePollsCache() {
  localStorage.removeItem(POLLS_CACHE_KEY);
  localStorage.removeItem(ADMIN_POLLS_CACHE_KEY);
}
