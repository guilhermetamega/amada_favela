export type MembershipCheckoutResponse = {
  url: string;
  sessionId: string;
  paymentMethods?: string[];
};

export type MembershipCheckoutStatusResponse = {
  paymentId: string;
  paymentStatus: string;
  paymentMethodType: string | null;
  checkoutMode: string | null;
  partnerId: string | null;
  partnerStatus: string | null;
  partnerActive: boolean;
  subscriptionId: string | null;
  expiresAt: string | null;
  terminal: boolean;
};

export type OpenMembershipPayment = {
  id: string;
  status: "pending" | "processing" | "requires_action";
  created_at: string;
  checkout_mode: string | null;
  stripe_checkout_session_id: string | null;
};
