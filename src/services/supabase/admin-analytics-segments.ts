import { supabase } from "@/services/supabase/client";
import type {
  AnalyticsMemberSegment,
  AnalyticsSegmentUser,
  AnalyticsSegmentUsersFilters,
  AnalyticsSegmentUsersResponse,
} from "@/types/admin-analytics-segments";

const CACHE_TTL_MS = 30_000;

type CacheEntry = {
  expiresAt: number;
  data: AnalyticsSegmentUsersResponse;
};

const cache = new Map<string, CacheEntry>();

const inFlightRequests = new Map<
  string,
  Promise<AnalyticsSegmentUsersResponse>
>();

type SegmentUserRow = {
  id: string;
  fullname: string;

  email: string | null;
  phone: string | null;
  phone_digits: string | null;

  address_1: string;
  address_number: string | null;

  community: string;
  community_label: string;

  role: string;
  created_at: string;

  membership_segment: AnalyticsMemberSegment;

  approved_payment_count: number | string;

  total_contributed_cents: number | string;

  first_payment_at: string | null;
  last_payment_at: string | null;

  days_since_last_payment: number | string | null;

  partner_expires_at: string | null;
};

type SegmentResponseRow = {
  segment: AnalyticsMemberSegment;

  page: number | string;
  page_size: number | string;

  total_count: number | string;
  total_pages: number | string;

  can_view_sensitive_data: boolean;

  summary: {
    total_users: number | string;

    total_contributed_cents: number | string;

    users_with_phone: number | string;

    users_with_email: number | string;
  };

  items: SegmentUserRow[];
};

function mapUser(row: SegmentUserRow): AnalyticsSegmentUser {
  return {
    id: row.id,
    fullname: row.fullname,

    email: row.email,
    phone: row.phone,
    phoneDigits: row.phone_digits,

    address1: row.address_1,
    addressNumber: row.address_number,

    community: row.community,
    communityLabel: row.community_label,

    role: row.role,
    createdAt: row.created_at,

    membershipSegment: row.membership_segment,

    approvedPaymentCount: Number(row.approved_payment_count ?? 0),

    totalContributedCents: Number(row.total_contributed_cents ?? 0),

    firstPaymentAt: row.first_payment_at,

    lastPaymentAt: row.last_payment_at,

    daysSinceLastPayment:
      row.days_since_last_payment === null ||
      row.days_since_last_payment === undefined
        ? null
        : Number(row.days_since_last_payment),

    partnerExpiresAt: row.partner_expires_at,
  };
}

function getCacheKey(filters: AnalyticsSegmentUsersFilters) {
  return JSON.stringify({
    segment: filters.segment,

    search: filters.search.trim(),

    page: filters.page,
    pageSize: filters.pageSize,

    community: filters.community || null,

    street: filters.street || null,
  });
}

export async function listAnalyticsSegmentUsers(
  filters: AnalyticsSegmentUsersFilters,
  options: {
    force?: boolean;
  } = {},
): Promise<AnalyticsSegmentUsersResponse> {
  const cacheKey = getCacheKey(filters);

  if (!options.force) {
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const inFlight = inFlightRequests.get(cacheKey);

    if (inFlight) {
      return inFlight;
    }
  }

  const request = (async () => {
    const { data, error } = await supabase.rpc(
      "admin_list_analytics_segment_users",
      {
        p_segment: filters.segment,

        p_search: filters.search.trim() || null,

        p_page: filters.page,

        p_page_size: filters.pageSize,

        p_community: filters.community || null,

        p_street: filters.street || null,
      },
    );

    if (error) {
      throw new Error(
        error.message || "Não foi possível carregar os usuários do segmento.",
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error("A consulta retornou uma resposta inválida.");
    }

    const row = data as unknown as SegmentResponseRow;

    const response: AnalyticsSegmentUsersResponse = {
      segment: row.segment,

      page: Number(row.page ?? 1),

      pageSize: Number(row.page_size ?? 12),

      totalCount: Number(row.total_count ?? 0),

      totalPages: Number(row.total_pages ?? 0),

      canViewSensitiveData: row.can_view_sensitive_data === true,

      summary: {
        totalUsers: Number(row.summary?.total_users ?? 0),

        totalContributedCents: Number(
          row.summary?.total_contributed_cents ?? 0,
        ),

        usersWithPhone: Number(row.summary?.users_with_phone ?? 0),

        usersWithEmail: Number(row.summary?.users_with_email ?? 0),
      },

      items: Array.isArray(row.items) ? row.items.map(mapUser) : [],
    };

    cache.set(cacheKey, {
      data: response,

      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return response;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (inFlightRequests.get(cacheKey) === request) {
      inFlightRequests.delete(cacheKey);
    }
  }
}

export function clearAnalyticsSegmentUsersCache() {
  cache.clear();
}
