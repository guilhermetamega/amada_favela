export type UserRole = "user" | "employee" | "president" | "admin";

export type ManageableUser = {
  id: string;
  fullname: string;
  email: string;
  phone: string | null;
  address_1: string;
  address_2: string | null;
  comunity: string | null;
  role: UserRole;
  created_at: string;
};

export type PlatformThirdPartyStripeStatus = {
  connected: boolean;
  label: string;
  stripe_connected_account_id: string | null;
  stripe_onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  card_payments_enabled: boolean;
  transfers_enabled: boolean;
  requirements_currently_due: string[];
  requirements_disabled_reason: string | null;
  mirrored_associations?: number;
  mode: "none" | "status" | "onboarding" | "login";
  url: string | null;
};
