import { supabase } from "@/services/supabase/client";
import { buildAddressLine, normalizeAddressNumber } from "@/utils/address";
import type {
  CreateServiceOrderInput,
  GroupedServiceOrder,
  ServiceOrder,
  ServiceOrderCategory,
} from "@/types/service_orders";

type CurrentProfile = {
  id: string;
  role: string;
  comunity: string;
};

type CachePayload<T> = {
  expiresAt: number;
  data: T;
};

const CACHE_TTL_MS = 60_000;
const CACHE_KEY_PREFIX = "service_orders_v3";
const LEGACY_CACHE_KEYS = [
  "my_service_orders_v2",
  "admin_service_orders_v2",
] as const;
const ACTIVE_CACHE_CONTEXT_KEY = `${CACHE_KEY_PREFIX}:active_context`;

type ServiceOrdersCacheContext = {
  userId: string;
  community?: string | null;
};

function buildMyServiceOrdersCacheKey({ userId }: ServiceOrdersCacheContext) {
  return `${CACHE_KEY_PREFIX}:my:${userId}`;
}

function buildAdminServiceOrdersCacheKey({
  userId,
  community,
}: ServiceOrdersCacheContext) {
  if (!community) return null;
  return `${CACHE_KEY_PREFIX}:admin:${community}:${userId}`;
}

function buildServiceOrdersCacheKeys(context: ServiceOrdersCacheContext) {
  return {
    my: buildMyServiceOrdersCacheKey(context),
    admin: buildAdminServiceOrdersCacheKey(context),
  };
}

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachePayload<T>;

    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;

  try {
    const payload: CachePayload<T> = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data,
    };

    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    //
  }
}

function clearServiceOrdersCache(context?: ServiceOrdersCacheContext) {
  if (typeof window === "undefined") return;

  if (context) {
    const keys = buildServiceOrdersCacheKeys(context);
    window.sessionStorage.removeItem(keys.my);
    if (keys.admin) {
      window.sessionStorage.removeItem(keys.admin);
    }
    return;
  }

  const keysToRemove: string[] = [...LEGACY_CACHE_KEYS];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}

function syncCacheContext(next: ServiceOrdersCacheContext) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_CACHE_CONTEXT_KEY);
    const previous = raw ? (JSON.parse(raw) as ServiceOrdersCacheContext) : null;

    const userChanged = !!previous?.userId && previous.userId !== next.userId;
    const communityChanged =
      typeof next.community === "string" &&
      !!previous?.community &&
      previous.community !== next.community;

    if (userChanged || communityChanged) {
      clearServiceOrdersCache();
    }

    const mergedContext: ServiceOrdersCacheContext = {
      userId: next.userId,
      community: next.community ?? previous?.community ?? null,
    };

    window.sessionStorage.setItem(
      ACTIVE_CACHE_CONTEXT_KEY,
      JSON.stringify(mergedContext),
    );
  } catch {
    clearServiceOrdersCache();
  }
}

async function getCurrentProfile(): Promise<CurrentProfile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CurrentProfile;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user.id;
}

function groupServiceOrders(orders: ServiceOrder[]): GroupedServiceOrder[] {
  const groups = new Map<string, GroupedServiceOrder>();

  for (const order of orders) {
    const normalizedNumber = normalizeAddressNumber(order.address_number);

    const groupKey = [
      order.address_1.trim().toLowerCase(),
      normalizedNumber.toLowerCase(),
      order.normalized_issue_key.trim().toLowerCase(),
    ].join("::");

    const displayIssue =
      order.category_slug === "outros"
        ? order.custom_issue?.trim() || order.category_label
        : order.category_label;

    const existing = groups.get(groupKey);

    if (existing) {
      existing.requests_count += 1;
      existing.items.push(order);
      existing.items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      existing.last_created_at =
        existing.items[0]?.created_at ?? existing.last_created_at;
      continue;
    }

    groups.set(groupKey, {
      address_1: order.address_1,
      address_number: normalizedNumber || null,
      address_label: buildAddressLine(order.address_1, normalizedNumber),
      category_label: order.category_label,
      normalized_issue_key: order.normalized_issue_key,
      display_issue: displayIssue,
      requests_count: 1,
      last_created_at: order.created_at,
      items: [order],
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    return (
      new Date(b.last_created_at).getTime() -
      new Date(a.last_created_at).getTime()
    );
  });
}

export async function getServiceOrderCategories() {
  const { data, error } = await supabase
    .from("service_order_categories")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ServiceOrderCategory[];
}

export async function getMyServiceOrders() {
  const userId = await getCurrentUserId();
  const context: ServiceOrdersCacheContext = { userId };
  syncCacheContext(context);

  const cacheKeys = buildServiceOrdersCacheKeys(context);
  const cached = readCache<ServiceOrder[]>(cacheKeys.my);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("service_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const orders = (data ?? []) as ServiceOrder[];
  writeCache(cacheKeys.my, orders);
  return orders;
}

export async function createServiceOrder(input: CreateServiceOrderInput) {
  const { data, error } = await supabase.rpc("create_service_order", {
    input_category_slug: input.category_slug,
    input_custom_issue:
      input.category_slug === "outros"
        ? input.custom_issue?.trim() || null
        : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = await getCurrentUserId();
  clearServiceOrdersCache({ userId });
  clearServiceOrdersCache();
  return data as string;
}

export async function getAdminGroupedServiceOrders() {
  const profile = await getCurrentProfile();
  const context: ServiceOrdersCacheContext = {
    userId: profile.id,
    community: profile.comunity,
  };
  syncCacheContext(context);
  const cacheKeys = buildServiceOrdersCacheKeys(context);

  const cached = cacheKeys.admin
    ? readCache<GroupedServiceOrder[]>(cacheKeys.admin)
    : null;
  if (cached) return cached;

  if (!["admin", "employee", "president"].includes(profile.role)) {
    throw new Error("Acesso não autorizado.");
  }

  const { data, error } = await supabase
    .from("service_orders")
    .select("*")
    .eq("community", profile.comunity)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = groupServiceOrders((data ?? []) as ServiceOrder[]);
  if (cacheKeys.admin) {
    writeCache(cacheKeys.admin, grouped);
  }
  return grouped;
}

export async function resolveServiceOrderGroup(input: {
  address_1: string;
  address_number?: string | null;
  normalized_issue_key: string;
  resolution_note?: string;
}) {
  const normalizedNumber = normalizeAddressNumber(input.address_number);

  const { data, error } = await supabase.rpc("resolve_service_order_group", {
    input_address_1: input.address_1,
    input_address_number: normalizedNumber || null,
    input_normalized_issue_key: input.normalized_issue_key,
    input_resolution_note: input.resolution_note?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const profile = await getCurrentProfile();
  clearServiceOrdersCache({ userId: profile.id, community: profile.comunity });
  clearServiceOrdersCache();
  return Number(data ?? 0);
}
