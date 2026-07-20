import type { UserRole } from "@/lib/permissions";

export type AdminMembershipStatus =
  | "active"
  | "expiring_soon"
  | "past_due"
  | "former_member"
  | "paid_once"
  | "never_paid";

export type AdminUserListItem = {
  id: string;
  fullname: string;
  phone: string;

  address1: string;
  addressNumber: string | null;

  community: string;
  communityLabel: string;

  role: UserRole;
  createdAt: string;

  approvedPaymentsCount: number;
  totalContributedCents: number;

  firstPaymentAt: string | null;
  lastPaymentAt: string | null;

  membershipStatus: AdminMembershipStatus;
  partnerExpiresAt: string | null;
};

export type AdminUserListFilters = {
  search: string;
  role: UserRole | "";
  membershipStatus: AdminMembershipStatus | "";
  street: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
};

export type AdminUserListSummary = {
  totalUsers: number;
  activeMembers: number;
  expiringSoon: number;
  totalContributedCents: number;
};

export type AdminUserListResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  summary: AdminUserListSummary;
  items: AdminUserListItem[];
};
