const SPONSOR_SESSION_KEY = "sponsor_session_token";
const SPONSOR_PROFILE_KEY = "sponsor_profile";

export type StoredSponsorProfile = {
  sponsor: {
    id: string;
    name: string;
    email: string;
    role: string;
    expires_at: string;
  };
  features: Array<{
    key: string;
    label: string;
    description: string | null;
    icon: string | null;
    route: string | null;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
  }>;
};

export function getSponsorSessionToken() {
  return localStorage.getItem(SPONSOR_SESSION_KEY);
}

export function setSponsorSessionToken(token: string) {
  localStorage.setItem(SPONSOR_SESSION_KEY, token);
}

export function clearSponsorSessionToken() {
  localStorage.removeItem(SPONSOR_SESSION_KEY);
}

export function setSponsorProfile(data: StoredSponsorProfile) {
  localStorage.setItem(SPONSOR_PROFILE_KEY, JSON.stringify(data));
}

export function getSponsorProfile(): StoredSponsorProfile | null {
  const raw = localStorage.getItem(SPONSOR_PROFILE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSponsorProfile;
  } catch {
    return null;
  }
}

export function clearSponsorProfile() {
  localStorage.removeItem(SPONSOR_PROFILE_KEY);
}

export function clearSponsorSession() {
  clearSponsorSessionToken();
  clearSponsorProfile();
}
