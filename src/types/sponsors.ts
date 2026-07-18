// src/types/sponsors.ts
export type Sponsor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birth: string;
  role: string;
  profession: string | null;
  default_community: string | null;
  created_at: string;
  expires_at: string;
  status: "active" | "inactive" | "blocked";
};

export type SponsorFeature = {
  key: string;
  label: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export type SponsorLoginSuccess = {
  ok: true;
  token: string;
  sponsor: Pick<
    Sponsor,
    "id" | "name" | "email" | "role" | "expires_at" | "default_community"
  >;
  features: SponsorFeature[];
};

export type SponsorLoginError = {
  ok: false;
  code: "invalid_credentials" | "inactive" | "expired";
  message: string;
  expires_at?: string;
  sponsor_name?: string;
};

export type SponsorLoginResponse = SponsorLoginSuccess | SponsorLoginError;
