import type { BingoPublicData, BingoGame } from "@/types/bingo";

const PUBLIC_BINGO_CACHE_KEY = "bingo:public:list";
const ADMIN_BINGO_CACHE_KEY = "bingo:admin:list";

const TTL_MS = 1000 * 60 * 3;

type CachePayload<T> = {
  expiresAt: number;
  value: T;
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachePayload<T>;
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
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

export function readPublicBingoCache() {
  return read<BingoPublicData>(PUBLIC_BINGO_CACHE_KEY);
}

export function writePublicBingoCache(value: BingoPublicData) {
  write(PUBLIC_BINGO_CACHE_KEY, value);
}

export function readAdminBingoCache() {
  return read<BingoGame[]>(ADMIN_BINGO_CACHE_KEY);
}

export function writeAdminBingoCache(value: BingoGame[]) {
  write(ADMIN_BINGO_CACHE_KEY, value);
}

export function invalidateBingoCache() {
  localStorage.removeItem(PUBLIC_BINGO_CACHE_KEY);
  localStorage.removeItem(ADMIN_BINGO_CACHE_KEY);
}
