export type MercadoPagoSellerStatus =
  | "not_connected"
  | "active"
  | "expired"
  | "revoked";

export type AssociationMercadoPagoStatusResponse = {
  mercadopago_user_id: string | null;
  mercadopago_status: MercadoPagoSellerStatus;
  mercadopago_connected_at: string | null;
};

export type AssociationFormData = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  headquarters_address: string;
  headquarters_number: string;
  headquarters_complement: string;
  headquarters_neighborhood: string;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string;
  logo_path: string;
  logo_url: string | null;
  signature_path: string;
  signature_url: string | null;
  president_name: string;
  president_role: string;
  is_active: boolean;
  monthly_fee: string;

  stripe_connected_account_id: string;
  stripe_onboarding_completed: boolean;

  mercadopago_user_id: string;
  mercadopago_status: MercadoPagoSellerStatus;
  mercadopago_connected_at: string | null;
};

export type AssociationRow = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  headquarters_address: string;
  headquarters_number: string | null;
  headquarters_complement: string | null;
  headquarters_neighborhood: string | null;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string | null;
  logo_path: string | null;
  signature_path: string | null;
  president_name: string;
  president_role: string | null;
  is_active: boolean;
  monthly_fee: number | string | null;
};

export type AssociationUpdateInput = {
  id: string;
  name: string;
  cnpj: string;
  headquarters_address: string;
  headquarters_number: string;
  headquarters_complement: string;
  headquarters_neighborhood: string;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string;
  logo_path: string;
  signature_path: string;
  president_name: string;
  president_role: string;
  is_active: boolean;
  monthly_fee: string;
};

export type CurrentAssociationAccess = {
  allowed: boolean;
  reason: string | null;
  role: string | null;
  community: string | null;
};

export type CurrentProfileAssociationRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};

export type AssociationStripeOnboardingResponse = {
  url: string;
  mode: "onboarding" | "login";
};

export type AssociationStripeStatusResponse = {
  stripe_connected_account_id: string | null;
  stripe_onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  pix_enabled: boolean;
  card_payments_enabled: boolean;
  boleto_enabled: boolean;
  requirements_currently_due: string[];
};

export type AssociationMercadoPagoConnectResponse = {
  url: string;
  expiresAt: string;
};
