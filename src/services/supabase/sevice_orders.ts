import { supabase } from "@/services/supabase/client";
import type {
  CreateServiceOrderInput,
  GroupedServiceOrder,
  ServiceOrder,
  ServiceOrderCategory,
} from "@/types/service_orders";
import {
  invalidateServiceOrdersCache,
  readAdminServiceOrdersCache,
  readServiceOrderCategoriesCache,
  readUserServiceOrdersCache,
  writeAdminServiceOrdersCache,
  writeServiceOrderCategoriesCache,
  writeUserServiceOrdersCache,
} from "@/lib/cache/serviceOrders";

type ProfileRow = {
  id: string;
  role: string;
  comunity: string;
  address_1: string | null;
};

async function getCurrentProfile(): Promise<ProfileRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("users")
    .select("id, role, comunity, address_1")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar seu perfil.");
  }

  return data as ProfileRow;
}

export async function getServiceOrderCategories() {
  const cached = readServiceOrderCategoriesCache();
  if (cached) return cached;

  const { data, error } = await supabase
    .from("service_order_categories")
    .select("id, slug, label, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const categories = (data ?? []) as ServiceOrderCategory[];
  writeServiceOrderCategoriesCache(categories);
  return categories;
}

export async function createServiceOrder(input: CreateServiceOrderInput) {
  const { data, error } = await supabase.rpc("create_service_order", {
    input_category_slug: input.category_slug,
    input_custom_issue: input.custom_issue?.trim() || null,
  });

  if (error) throw new Error(error.message);

  invalidateServiceOrdersCache();
  return data as string;
}

export async function getMyServiceOrders() {
  const cached = readUserServiceOrdersCache();
  if (cached) return cached;

  const profile = await getCurrentProfile();

  const { data, error } = await supabase
    .from("service_orders")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const value = (data ?? []) as ServiceOrder[];
  writeUserServiceOrdersCache(value);
  return value;
}

function groupServiceOrders(items: ServiceOrder[]): GroupedServiceOrder[] {
  const map = new Map<string, GroupedServiceOrder>();

  for (const item of items) {
    const key = `${item.address_1}::${item.normalized_issue_key}`;

    const displayIssue =
      item.category_slug === "outros"
        ? item.custom_issue || item.category_label
        : item.category_label;

    const current = map.get(key);

    if (!current) {
      map.set(key, {
        address_1: item.address_1,
        normalized_issue_key: item.normalized_issue_key,
        category_label: item.category_label,
        display_issue: displayIssue,
        requests_count: 1,
        last_created_at: item.created_at,
        items: [item],
      });
      continue;
    }

    current.requests_count += 1;
    current.items.push(item);

    if (new Date(item.created_at) > new Date(current.last_created_at)) {
      current.last_created_at = item.created_at;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.last_created_at).getTime() -
      new Date(a.last_created_at).getTime(),
  );
}

export async function getAdminGroupedServiceOrders() {
  const cached = readAdminServiceOrdersCache();
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

  if (error) throw new Error(error.message);

  const grouped = groupServiceOrders((data ?? []) as ServiceOrder[]);
  writeAdminServiceOrdersCache(grouped);
  return grouped;
}

export async function resolveServiceOrderGroup(
  address1: string,
  normalizedIssueKey: string,
  resolutionNote?: string,
) {
  const { data, error } = await supabase.rpc("resolve_service_order_group", {
    input_address_1: address1,
    input_normalized_issue_key: normalizedIssueKey,
    input_resolution_note: resolutionNote?.trim() || null,
  });

  if (error) throw new Error(error.message);

  invalidateServiceOrdersCache();
  return data as number;
}
