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
