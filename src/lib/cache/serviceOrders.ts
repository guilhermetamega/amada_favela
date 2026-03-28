import type {
  GroupedServiceOrder,
  ServiceOrder,
  ServiceOrderCategory,
} from "@/types/service_orders";

const USER_ORDERS_KEY = "service-orders:user";
const ADMIN_ORDERS_KEY = "service-orders:admin";
const CATEGORIES_KEY = "service-orders:categories";

const USER_TTL = 1000 * 60 * 5;
const ADMIN_TTL = 1000 * 60 * 3;
const CATEGORIES_TTL = 1000 * 60 * 60 * 24;

type CachePayload<T> = {
  expiresAt: number;
  value: T;
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachePayload<T>;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T, ttl: number) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: Date.now() + ttl,
        value,
      }),
    );
  } catch {
    // noop
  }
}

export function readUserServiceOrdersCache() {
  return read<ServiceOrder[]>(USER_ORDERS_KEY);
}

export function writeUserServiceOrdersCache(value: ServiceOrder[]) {
  write(USER_ORDERS_KEY, value, USER_TTL);
}

export function readAdminServiceOrdersCache() {
  return read<GroupedServiceOrder[]>(ADMIN_ORDERS_KEY);
}

export function writeAdminServiceOrdersCache(value: GroupedServiceOrder[]) {
  write(ADMIN_ORDERS_KEY, value, ADMIN_TTL);
}

export function readServiceOrderCategoriesCache() {
  return read<ServiceOrderCategory[]>(CATEGORIES_KEY);
}

export function writeServiceOrderCategoriesCache(
  value: ServiceOrderCategory[],
) {
  write(CATEGORIES_KEY, value, CATEGORIES_TTL);
}

export function invalidateServiceOrdersCache() {
  localStorage.removeItem(USER_ORDERS_KEY);
  localStorage.removeItem(ADMIN_ORDERS_KEY);
}
