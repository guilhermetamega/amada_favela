import { supabase } from "@/services/supabase/client";
import type {
  AdminMembershipStatus,
  AdminUserListFilters,
  AdminUserListItem,
  AdminUserListResponse,
} from "@/types/admin-users";
import type { UserRole } from "@/lib/permissions";

type AdminUserListItemRow = {
  id: string;
  fullname: string;
  phone: string;

  address_1: string;
  address_number: string | null;

  community: string;
  community_label: string;

  role: UserRole;
  created_at: string;

  approved_payments_count: number;
  total_contributed_cents: number;

  first_payment_at: string | null;
  last_payment_at: string | null;

  membership_status: AdminMembershipStatus;
  partner_expires_at: string | null;
};

type AdminUserListResponseRow = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;

  summary: {
    total_users: number;
    active_members: number;
    expiring_soon: number;
    total_contributed_cents: number;
  };

  items: AdminUserListItemRow[];
};

function mapUser(row: AdminUserListItemRow): AdminUserListItem {
  return {
    id: row.id,
    fullname: row.fullname,
    phone: row.phone,

    address1: row.address_1,
    addressNumber: row.address_number,

    community: row.community,
    communityLabel: row.community_label,

    role: row.role,
    createdAt: row.created_at,

    approvedPaymentsCount: Number(row.approved_payments_count ?? 0),

    totalContributedCents: Number(row.total_contributed_cents ?? 0),

    firstPaymentAt: row.first_payment_at,
    lastPaymentAt: row.last_payment_at,

    membershipStatus: row.membership_status,
    partnerExpiresAt: row.partner_expires_at,
  };
}

export async function listAdminUsers(
  filters: AdminUserListFilters,
): Promise<AdminUserListResponse> {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: filters.search.trim() || null,
    p_role: filters.role || null,

    p_membership_status: filters.membershipStatus || null,

    p_street: filters.street.trim() || null,

    p_created_from: filters.createdFrom || null,

    p_created_to: filters.createdTo || null,

    p_page: filters.page,
    p_page_size: filters.pageSize,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível carregar os usuários.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("A consulta de usuários retornou uma resposta inválida.");
  }

  const response = data as unknown as AdminUserListResponseRow;

  return {
    page: Number(response.page ?? 1),
    pageSize: Number(response.page_size ?? 12),
    totalCount: Number(response.total_count ?? 0),
    totalPages: Number(response.total_pages ?? 0),

    summary: {
      totalUsers: Number(response.summary?.total_users ?? 0),

      activeMembers: Number(response.summary?.active_members ?? 0),

      expiringSoon: Number(response.summary?.expiring_soon ?? 0),

      totalContributedCents: Number(
        response.summary?.total_contributed_cents ?? 0,
      ),
    },

    items: Array.isArray(response.items) ? response.items.map(mapUser) : [],
  };
}
