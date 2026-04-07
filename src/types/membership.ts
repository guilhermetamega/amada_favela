export type MembershipCheckoutResponse = {
  url: string;
  sessionId: string;
  paymentMethods?: string[];
};

export type MembershipCheckoutStatusResponse = {
  paymentId: string;
  paymentStatus: string;
  partnerActive: boolean;
  subscriptionId: string | null;
  expiresAt: string | null;
  terminal: boolean;
};
