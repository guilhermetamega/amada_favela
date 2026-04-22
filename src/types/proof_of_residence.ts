export type Association = {
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
  logo_path: string | null;
  signature_path: string | null;
  logo_url: string | null;
  signature_url: string | null;
  president_name: string;
  president_role: string;
  is_active: boolean;
};

export type ProofUserProfile = {
  id: string;
  fullname: string;
  cpf: string;
  zipcode: string;
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  community: string;
  role?: string | null;
};

export type ResidenceProof = {
  id: string;
  user_id: string;
  association_id: string;
  generated_by: string;
  community: string;
  issued_at: string;
  expires_at: string;
  validation_code: string;
  verification_url: string;
  integrity_hash: string;
  status: "valid" | "expired" | "revoked";
  full_name_snapshot: string;
  cpf_snapshot: string;
  zipcode_snapshot: string;
  address_snapshot: string;
  complement_snapshot: string | null;
  created_at: string;
};

export type ProofEligibility = {
  allowed: boolean;
  reason: string | null;
  user: ProofUserProfile | null;
  association: Association | null;
};

export type CreateResidenceProofInput = {
  user: ProofUserProfile;
  association: Association;
  issuedAt: string;
  expiresAt: string;
  validationCode: string;
  verificationUrl: string;
  integrityHash: string;
};

export type ValidateResidenceProofResult = {
  valid: boolean;
  reason: string | null;
  record: ResidenceProof | null;
};

export type PartnerRow = {
  id: string;
  user_id: string;
  expires_at: string;
};

export type ProofUserProfileRow = {
  id: string;
  fullname: string;
  cpf: string;
  zipcode: string;
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  comunity: string;
  role: string | null;
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
  logo_path: string | null;
  signature_path: string | null;
  president_name: string;
  president_role: string;
  is_active: boolean;
};
