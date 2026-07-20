import { supabase } from "@/services/supabase/client";
import type {
  AdminUserAuditLog,
  AdminUserAuditResponse,
  AdminUserDetailResponse,
  AdminUserMembership,
  AdminUserPayment,
  AdminUserPaymentsResponse,
} from "@/types/admin-user-detail";

type MembershipRow = {
  id: string;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  expires_at: string;
  payment_id: string | null;
  association_id: string | null;
  association_name: string | null;
};

type DetailRow = {
  profile: {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    cpf: string | null;
    birth: string | null;

    address_1: string;
    address_number: string | null;
    address_2: string | null;
    zipcode: string;

    community: string;
    community_label: string;
    role: AdminUserDetailResponse["profile"]["role"];

    picture_path: string | null;
    created_at: string;
    password_change_required: boolean;

    membership_status: AdminUserDetailResponse["profile"]["membershipStatus"];
  };

  permissions: {
    can_view_sensitive_data: boolean;
    can_edit_basic_data: boolean;
    can_edit_sensitive_data: boolean;
    can_reset_password: boolean;
  };

  financial_summary: {
    approved_payments_count: number;
    total_contributed_cents: number;
    association_net_cents: number;
    first_payment_at: string | null;
    last_payment_at: string | null;
  };

  current_membership: MembershipRow | null;
  membership_history: MembershipRow[];
};

type PaymentRow = {
  id: string;
  provider: string;
  purpose: string;
  status: string;
  provider_status: string | null;
  payment_method_type: string | null;
  checkout_mode: string | null;

  amount_total: number;
  amount_association_transfer: number;
  amount_gateway_fee: number;

  reference_month: string | null;
  paid_at: string | null;
  created_at: string;
  receipt_url: string | null;
};

type PaymentResponseRow = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: PaymentRow[];
};

type AuditRow = {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action_type: string;
  changed_fields: string[];
  change_summary: Record<string, unknown>;
  verification_method: string;
  reason: string;
  created_at: string;
};

type AuditResponseRow = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: AuditRow[];
};

function mapMembership(row: MembershipRow): AdminUserMembership {
  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    paymentId: row.payment_id,
    associationId: row.association_id,
    associationName: row.association_name,
  };
}

function mapPayment(row: PaymentRow): AdminUserPayment {
  return {
    id: row.id,
    provider: row.provider,
    purpose: row.purpose,
    status: row.status,
    providerStatus: row.provider_status,
    paymentMethodType: row.payment_method_type,
    checkoutMode: row.checkout_mode,

    amountTotal: Number(row.amount_total ?? 0),

    amountAssociationTransfer: Number(row.amount_association_transfer ?? 0),

    amountGatewayFee: Number(row.amount_gateway_fee ?? 0),

    referenceMonth: row.reference_month,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    receiptUrl: row.receipt_url,
  };
}

function mapAudit(row: AuditRow): AdminUserAuditLog {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actionType: row.action_type,
    changedFields: Array.isArray(row.changed_fields) ? row.changed_fields : [],
    changeSummary:
      row.change_summary && typeof row.change_summary === "object"
        ? row.change_summary
        : {},
    verificationMethod: row.verification_method,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetailResponse> {
  const { data, error } = await supabase.rpc("admin_get_user_detail", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível carregar o usuário.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("O perfil retornou uma resposta inválida.");
  }

  const row = data as unknown as DetailRow;

  return {
    profile: {
      id: row.profile.id,
      fullname: row.profile.fullname,
      email: row.profile.email,
      phone: row.profile.phone,
      cpf: row.profile.cpf,
      birth: row.profile.birth,

      address1: row.profile.address_1,
      addressNumber: row.profile.address_number,
      address2: row.profile.address_2,
      zipcode: row.profile.zipcode,

      community: row.profile.community,
      communityLabel: row.profile.community_label,
      role: row.profile.role,

      picturePath: row.profile.picture_path,
      createdAt: row.profile.created_at,

      passwordChangeRequired: row.profile.password_change_required,

      membershipStatus: row.profile.membership_status,
    },

    permissions: {
      canViewSensitiveData: row.permissions.can_view_sensitive_data,

      canEditBasicData: row.permissions.can_edit_basic_data,

      canEditSensitiveData: row.permissions.can_edit_sensitive_data,

      canResetPassword: row.permissions.can_reset_password,
    },

    financialSummary: {
      approvedPaymentsCount: Number(
        row.financial_summary.approved_payments_count ?? 0,
      ),

      totalContributedCents: Number(
        row.financial_summary.total_contributed_cents ?? 0,
      ),

      associationNetCents: Number(
        row.financial_summary.association_net_cents ?? 0,
      ),

      firstPaymentAt: row.financial_summary.first_payment_at,

      lastPaymentAt: row.financial_summary.last_payment_at,
    },

    currentMembership: row.current_membership
      ? mapMembership(row.current_membership)
      : null,

    membershipHistory: Array.isArray(row.membership_history)
      ? row.membership_history.map(mapMembership)
      : [],
  };
}

export async function listAdminUserPayments(
  userId: string,
  page: number,
  pageSize = 10,
): Promise<AdminUserPaymentsResponse> {
  const { data, error } = await supabase.rpc("admin_list_user_payments", {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
  });

  if (error) {
    throw new Error(
      error.message || "Não foi possível carregar os pagamentos.",
    );
  }

  const row = data as unknown as PaymentResponseRow;

  return {
    page: Number(row?.page ?? 1),
    pageSize: Number(row?.page_size ?? pageSize),
    totalCount: Number(row?.total_count ?? 0),
    totalPages: Number(row?.total_pages ?? 0),

    items: Array.isArray(row?.items) ? row.items.map(mapPayment) : [],
  };
}

export async function listAdminUserAuditLogs(
  userId: string,
  page: number,
  pageSize = 10,
): Promise<AdminUserAuditResponse> {
  const { data, error } = await supabase.rpc("admin_list_user_audit_logs", {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível carregar a auditoria.");
  }

  const row = data as unknown as AuditResponseRow;

  return {
    page: Number(row?.page ?? 1),
    pageSize: Number(row?.page_size ?? pageSize),
    totalCount: Number(row?.total_count ?? 0),
    totalPages: Number(row?.total_pages ?? 0),

    items: Array.isArray(row?.items) ? row.items.map(mapAudit) : [],
  };
}
