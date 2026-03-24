import { supabase } from "@/services/supabase/client";
import type {
  AssociationFormData,
  AssociationRow,
  AssociationUpdateInput,
  CurrentAssociationAccess,
  CurrentProfileAssociationRow,
} from "@/types/association";

export type AssociationPublicData = {
  name: string;
  community: string;
  description?: string | null;
  logo_url: string | null;
  banner_url: string | null;
};

const COMMUNITY_IMAGE_BUCKET = "community_image";
const ASSOCIATION_SIGNATURES_BUCKET = "association_signatures";

function normalizeNullableText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function getFileExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext || "png";
}

async function getAuthenticatedUser() {
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

  return user;
}

async function getCurrentProfileRow(): Promise<CurrentProfileAssociationRow> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, comunity")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível carregar as permissões do usuário.");
  }

  return data as CurrentProfileAssociationRow;
}

export async function getCurrentAssociationAccess(): Promise<CurrentAssociationAccess> {
  const profile = await getCurrentProfileRow();

  const role = profile.role ?? null;
  const community = profile.comunity ?? null;
  const allowed = role === "admin" || role === "president";

  return {
    allowed,
    reason: allowed
      ? null
      : "Apenas president e admin podem editar os dados da associação.",
    role,
    community,
  };
}

async function getPublicLogoUrl(path: string | null) {
  if (!path) return null;

  const { data } = supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

async function getPrivateSignatureUrl(path: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(ASSOCIATION_SIGNATURES_BUCKET)
    .createSignedUrl(path, 60 * 30);

  if (error) {
    throw new Error("Não foi possível gerar a URL assinada da assinatura.");
  }

  return data.signedUrl;
}

function mapAssociationRowToFormData(
  row: AssociationRow,
  logoUrl: string | null,
  signatureUrl: string | null,
): AssociationFormData {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    community: row.community,
    headquarters_address: row.headquarters_address,
    headquarters_number: normalizeNullableText(row.headquarters_number),
    headquarters_complement: normalizeNullableText(row.headquarters_complement),
    headquarters_neighborhood: normalizeNullableText(
      row.headquarters_neighborhood,
    ),
    headquarters_city: row.headquarters_city,
    headquarters_state: row.headquarters_state,
    headquarters_zipcode: row.headquarters_zipcode,
    logo_path: normalizeNullableText(row.logo_path),
    logo_url: logoUrl,
    signature_path: normalizeNullableText(row.signature_path),
    signature_url: signatureUrl,
    president_name: row.president_name,
    president_role: normalizeNullableText(row.president_role) || "Presidente",
    is_active: row.is_active,
  };
}

async function getAssociationRowByCommunity(
  community: string,
): Promise<AssociationRow> {
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

  return data as AssociationRow;
}

async function buildAssociationFormDataFromRow(row: AssociationRow) {
  const [logoUrl, signatureUrl] = await Promise.all([
    getPublicLogoUrl(row.logo_path),
    getPrivateSignatureUrl(row.signature_path),
  ]);

  return mapAssociationRowToFormData(row, logoUrl, signatureUrl);
}

export async function getMyAssociation(): Promise<AssociationFormData> {
  const access = await getCurrentAssociationAccess();

  if (!access.allowed || !access.community) {
    throw new Error(
      access.reason || "Você não tem permissão para editar a associação.",
    );
  }

  const row = await getAssociationRowByCommunity(access.community);
  return buildAssociationFormDataFromRow(row);
}

export async function uploadAssociationLogo(file: File, community: string) {
  const user = await getAuthenticatedUser();

  const ext = getFileExtension(file.name);
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  const safeName = sanitizeFileName(nameWithoutExt);

  // path salvo no banco: mandela2/arquivo.ext
  const filePath = `${community}/${user.id}-${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("Não foi possível enviar a logo da associação.");
  }

  const { data } = supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .getPublicUrl(filePath);

  return {
    logoPath: filePath,
    logoUrl: data.publicUrl,
  };
}

export async function uploadAssociationSignature(
  file: File,
  community: string,
) {
  const user = await getAuthenticatedUser();

  const ext = getFileExtension(file.name);
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  const safeName = sanitizeFileName(nameWithoutExt);

  // path salvo no banco: mandela2/arquivo.ext
  const filePath = `${community}/${user.id}-${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from(ASSOCIATION_SIGNATURES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("Não foi possível enviar a assinatura da associação.");
  }

  const signatureUrl = await getPrivateSignatureUrl(filePath);

  return {
    signaturePath: filePath,
    signatureUrl,
  };
}

export async function updateAssociation(
  input: AssociationUpdateInput,
): Promise<AssociationFormData> {
  const access = await getCurrentAssociationAccess();

  if (!access.allowed) {
    throw new Error("Você não tem permissão para editar a associação.");
  }

  if (!access.community) {
    throw new Error("Comunidade do usuário não encontrada.");
  }

  const currentAssociation = await getAssociationRowByCommunity(
    access.community,
  );

  if (!currentAssociation) {
    throw new Error("Associação não encontrada.");
  }

  if (access.role !== "admin" && currentAssociation.id !== input.id) {
    throw new Error("Você não pode editar outra associação.");
  }

  const payload = {
    name: input.name.trim(),
    cnpj: input.cnpj.trim(),
    headquarters_address: input.headquarters_address.trim(),
    headquarters_number: input.headquarters_number.trim() || null,
    headquarters_complement: input.headquarters_complement.trim() || null,
    headquarters_neighborhood: input.headquarters_neighborhood.trim() || null,
    headquarters_city: input.headquarters_city.trim(),
    headquarters_state: input.headquarters_state.trim().toUpperCase(),
    headquarters_zipcode: input.headquarters_zipcode.trim(),
    logo_path: input.logo_path.trim() || null,
    signature_path: input.signature_path.trim() || null,
    president_name: input.president_name.trim(),
    president_role: input.president_role.trim() || "Presidente",
    is_active: input.is_active,
  };

  const { data, error } = await supabase
    .from("association")
    .update(payload)
    .eq("id", input.id)
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
    .single();

  if (error || !data) {
    throw new Error("Não foi possível atualizar os dados da associação.");
  }

  return buildAssociationFormDataFromRow(data as AssociationRow);
}

export async function getAssociationPublicData(): Promise<AssociationPublicData> {
  const profile = await getCurrentProfileRow();

  if (!profile.comunity) {
    throw new Error("Comunidade do usuário não encontrada.");
  }

  const { data, error } = await supabase
    .from("association")
    .select(
      `
      name,
      community,
      logo_path
    `,
    )
    .eq("community", profile.comunity)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error(
      "Não foi possível carregar os dados públicos da associação.",
    );
  }

  const { data: logoData } = supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .getPublicUrl(data.logo_path);

  return {
    name: data.name,
    community: data.community,
    description: null,
    logo_url: logoData.publicUrl,
    banner_url: logoData.publicUrl, // temporário (explico abaixo)
  };
}
