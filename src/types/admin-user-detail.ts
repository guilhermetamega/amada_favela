import type { UserRole } from "@/lib/permissions";
import type { AdminMembershipStatus } from "@/types/admin-users";

export type AdminUserDetailProfile = {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  cpf: string | null;
  birth: string | null;

  address1: string;
  addressNumber: string | null;
  address2: string | null;
  zipcode: string;

  community: string;
  communityLabel: string;
  role: UserRole;

  picturePath: string | null;
  createdAt: string;
  passwordChangeRequired: boolean;
  membershipStatus: AdminMembershipStatus;
};

export type AdminUserDetailPermissions = {
  canViewSensitiveData: boolean;
  canEditBasicData: boolean;
  canEditSensitiveData: boolean;
  canResetPassword: boolean;
};

export type AdminUserFinancialSummary = {
  approvedPaymentsCount: number;
  totalContributedCents: number;
  associationNetCents: number;
  firstPaymentAt: string | null;
  lastPaymentAt: string | null;
};

export type AdminUserMembership = {
  id: string;
  status: string | null;
  paymentStatus: string | null;
  createdAt: string;
  expiresAt: string;
  paymentId: string | null;
  associationId: string | null;
  associationName: string | null;
};

export type AdminUserDetailResponse = {
  profile: AdminUserDetailProfile;
  permissions: AdminUserDetailPermissions;
  financialSummary: AdminUserFinancialSummary;
  currentMembership: AdminUserMembership | null;
  membershipHistory: AdminUserMembership[];
};

export type AdminUserPayment = {
  id: string;
  provider: string;
  purpose: string;
  status: string;
  providerStatus: string | null;
  paymentMethodType: string | null;
  checkoutMode: string | null;

  amountTotal: number;
  amountAssociationTransfer: number;
  amountGatewayFee: number;

  referenceMonth: string | null;
  paidAt: string | null;
  createdAt: string;
  receiptUrl: string | null;
};

export type AdminUserPaymentsResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: AdminUserPayment[];
};

export type AdminUserAuditLog = {
  id: string;
  actorUserId: string;
  actorName: string;
  actionType: string;
  changedFields: string[];
  changeSummary: Record<string, unknown>;
  verificationMethod: string;
  reason: string;
  createdAt: string;
};

export type AdminUserAuditResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: AdminUserAuditLog[];
};
