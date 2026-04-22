import { supabase } from "@/services/supabase/client";
import type {
  Association,
  AssociationRow,
  CreateResidenceProofInput,
  PartnerRow,
  ProofEligibility,
  ProofUserProfile,
  ProofUserProfileRow,
  ResidenceProof,
  ValidateResidenceProofResult,
} from "@/types/proof_of_residence";
import { buildUserAddress } from "@/utils/proof_of_residence";
import { getMyProfile } from "./user_profile";

const COMMUNITY_IMAGE_BUCKET = "community_image";
const ASSOCIATION_SIGNATURES_BUCKET = "association_signatures";

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user.id;
}

export async function getCurrentProofUserProfile(): Promise<ProofUserProfile> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, fullname, cpf, zipcode, address_1, address_number, address_2, comunity, role",
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar os dados do usuário.");
  }

  const row = data as ProofUserProfileRow;

  return {
    id: row.id,
    fullname: row.fullname,
    cpf: row.cpf,
    zipcode: row.zipcode,
    address_1: row.address_1,
    address_number: row.address_number,
    address_2: row.address_2,
    community: row.comunity,
    role: row.role,
  };
}

export async function isCurrentUserPartnerActive(): Promise<boolean> {
  const profile = await getMyProfile();

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("expires_at")
    .eq("user_id", profile.id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<PartnerRow>();

  if (partnerError) {
    throw new Error(partnerError.message);
  }

  if (!partner) {
    return false;
  }

  return new Date(partner.expires_at).getTime() >= Date.now();
}

async function getCommunityImageSignedUrl(path: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .createSignedUrl(path, 60 * 30);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

async function getAssociationSignatureSignedUrl(path: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(ASSOCIATION_SIGNATURES_BUCKET)
    .createSignedUrl(path, 60 * 30);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

function mapAssociationRowToAssociation(
  row: AssociationRow,
  logoUrl: string | null,
  signatureUrl: string | null,
): Association {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    community: row.community,
    headquarters_address: row.headquarters_address,
    headquarters_number: row.headquarters_number,
    headquarters_complement: row.headquarters_complement,
    headquarters_neighborhood: row.headquarters_neighborhood,
    headquarters_city: row.headquarters_city,
    headquarters_state: row.headquarters_state,
    headquarters_zipcode: row.headquarters_zipcode,
    logo_path: row.logo_path,
    signature_path: row.signature_path,
    logo_url: logoUrl,
    signature_url: signatureUrl,
    president_name: row.president_name,
    president_role: row.president_role,
    is_active: row.is_active,
  };
}

export async function getAssociationByCommunity(
  community: string,
): Promise<Association> {
  const { data, error } = await supabase
    .from("association")
    .select(
      `
        id,
        name,
        cnpj,
        community,
        headquarters_address,
        headquarters_number,
        headquarters_complement,
        headquarters_neighborhood,
        headquarters_city,
        headquarters_state,
        headquarters_zipcode,
        logo_path,
        signature_path,
        president_name,
        president_role,
        is_active
      `,
    )
    .eq("community", community)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar os dados da associação.");
  }

  const row = data as AssociationRow;

  const [logoUrl, signatureUrl] = await Promise.all([
    getCommunityImageSignedUrl(row.logo_path),
    getAssociationSignatureSignedUrl(row.signature_path),
  ]);

  return mapAssociationRowToAssociation(row, logoUrl, signatureUrl);
}

export async function getProofEligibility(): Promise<ProofEligibility> {
  try {
    const user = await getCurrentProofUserProfile();

    if (!user.fullname || !user.cpf || !user.zipcode || !user.address_1) {
      return {
        allowed: false,
        reason:
          "Complete seu cadastro antes de emitir a declaração de residência.",
        user,
        association: null,
      };
    }

    const isPartner = await isCurrentUserPartnerActive();

    if (!isPartner) {
      return {
        allowed: false,
        reason: "Somente sócios ativos podem emitir este documento.",
        user,
        association: null,
      };
    }

    const association = await getAssociationByCommunity(user.community);

    return {
      allowed: true,
      reason: null,
      user,
      association,
    };
  } catch (error) {
    return {
      allowed: false,
      reason:
        error instanceof Error
          ? error.message
          : "Não foi possível validar a emissão do documento.",
      user: null,
      association: null,
    };
  }
}

export async function createResidenceProofRecord(
  input: CreateResidenceProofInput,
) {
  const authUserId = await getAuthenticatedUserId();

  const addressSnapshot = buildUserAddress(input.user);

  const payload = {
    user_id: input.user.id,
    association_id: input.association.id,
    generated_by: authUserId,
    community: input.user.community,
    issued_at: input.issuedAt,
    expires_at: input.expiresAt,
    validation_code: input.validationCode,
    verification_url: input.verificationUrl,
    integrity_hash: input.integrityHash,
    status: "valid",
    full_name_snapshot: input.user.fullname,
    cpf_snapshot: input.user.cpf,
    zipcode_snapshot: input.user.zipcode,
    address_snapshot: addressSnapshot,
    complement_snapshot: input.user.address_2,
  };

  const { data, error } = await supabase
    .from("residence_proof")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error("Não foi possível registrar a emissão do documento.");
  }

  return data as ResidenceProof;
}

export async function validateResidenceProof(
  validationCode: string,
): Promise<ValidateResidenceProofResult> {
  const { data, error } = await supabase
    .from("residence_proof")
    .select("*")
    .eq("validation_code", validationCode)
    .single();

  if (error || !data) {
    return {
      valid: false,
      reason: "Documento não encontrado.",
      record: null,
    };
  }

  const record = data as ResidenceProof;

  if (record.status === "revoked") {
    return {
      valid: false,
      reason: "Documento revogado.",
      record,
    };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return {
      valid: false,
      reason: "Documento expirado.",
      record,
    };
  }

  return {
    valid: true,
    reason: null,
    record,
  };
}
