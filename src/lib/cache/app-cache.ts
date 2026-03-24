type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getStorageKey(key: string) {
  return `amada-cache:${key}`;
}

export function setCache<T>(key: string, data: T, ttl: number) {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {
    // ignora erro de storage
  }
}

export function getCache<T>(key: string): T | null {
  const memoryEntry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (memoryEntry) {
    const isExpired = Date.now() - memoryEntry.timestamp > memoryEntry.ttl;
    if (!isExpired) return memoryEntry.data;
  }

  try {
    const raw = sessionStorage.getItem(getStorageKey(key));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) return null;

    memoryCache.set(key, entry);
    return entry.data;
  } catch {
    return null;
  }
}

export function getCacheMeta<T>(key: string): CacheEntry<T> | null {
  const memoryEntry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (memoryEntry) {
    return memoryEntry;
  }

  try {
    const raw = sessionStorage.getItem(getStorageKey(key));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    memoryCache.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

export function isCacheExpired(key: string) {
  const entry = getCacheMeta(key);
  if (!entry) return true;

  return Date.now() - entry.timestamp > entry.ttl;
}

export function clearCache(key: string) {
  memoryCache.delete(key);
  try {
    sessionStorage.removeItem(getStorageKey(key));
  } catch {
    // ignora
  }
}
