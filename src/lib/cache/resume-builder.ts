import type {
  ResumeBuilderCachePayload,
  ResumeBuilderFormData,
} from "@/types/resume_builder";

const RESUME_BUILDER_CACHE_PREFIX = "resume_builder_cache_v1";

function getStorageKey(userId: string) {
  return `${RESUME_BUILDER_CACHE_PREFIX}:${userId}`;
}

export function getResumeBuilderCache(
  userId: string | null | undefined,
): ResumeBuilderCachePayload | null {
  if (!userId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ResumeBuilderCachePayload;

    if (parsed.userId !== userId || !parsed.data) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveResumeBuilderCache(
  userId: string,
  data: ResumeBuilderFormData,
) {
  if (typeof window === "undefined") return;

  const payload: ResumeBuilderCachePayload = {
    userId,
    data,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
  } catch {
    // noop
  }
}
