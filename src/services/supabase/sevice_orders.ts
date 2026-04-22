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
const MY_SERVICE_ORDERS_CACHE_KEY = "my_service_orders_v2";
const ADMIN_SERVICE_ORDERS_CACHE_KEY = "admin_service_orders_v2";

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

function clearServiceOrdersCache() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(MY_SERVICE_ORDERS_CACHE_KEY);
  window.sessionStorage.removeItem(ADMIN_SERVICE_ORDERS_CACHE_KEY);
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
  const cached = readCache<ServiceOrder[]>(MY_SERVICE_ORDERS_CACHE_KEY);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("service_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const orders = (data ?? []) as ServiceOrder[];
  writeCache(MY_SERVICE_ORDERS_CACHE_KEY, orders);
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

  clearServiceOrdersCache();
  return data as string;
}

export async function getAdminGroupedServiceOrders() {
  const cached = readCache<GroupedServiceOrder[]>(
    ADMIN_SERVICE_ORDERS_CACHE_KEY,
  );
  if (cached) return cached;

  const profile = await getCurrentProfile();

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
  writeCache(ADMIN_SERVICE_ORDERS_CACHE_KEY, grouped);
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

  clearServiceOrdersCache();
  return Number(data ?? 0);
}
