export type AnalyticsMemberSegment =
  | "active"
  | "expiring_soon"
  | "past_due"
  | "former_member"
  | "paid_once"
  | "never_paid";

export type AnalyticsSegmentUser = {
  id: string;
  fullname: string;

  email: string | null;
  phone: string | null;
  phoneDigits: string | null;

  address1: string;
  addressNumber: string | null;

  community: string;
  communityLabel: string;

  role: string;
  createdAt: string;

  membershipSegment: AnalyticsMemberSegment;

  approvedPaymentCount: number;
  totalContributedCents: number;

  firstPaymentAt: string | null;
  lastPaymentAt: string | null;

  daysSinceLastPayment: number | null;
  partnerExpiresAt: string | null;
};

export type AnalyticsSegmentUsersSummary = {
  totalUsers: number;
  totalContributedCents: number;
  usersWithPhone: number;
  usersWithEmail: number;
};

export type AnalyticsSegmentUsersResponse = {
  segment: AnalyticsMemberSegment;

  page: number;
  pageSize: number;

  totalCount: number;
  totalPages: number;

  canViewSensitiveData: boolean;

  summary: AnalyticsSegmentUsersSummary;

  items: AnalyticsSegmentUser[];
};

export type AnalyticsSegmentUsersFilters = {
  segment: AnalyticsMemberSegment;
  search: string;
  page: number;
  pageSize: number;

  community: string;
  street: string;
};
