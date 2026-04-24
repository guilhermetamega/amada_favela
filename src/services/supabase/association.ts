import { supabase } from "@/services/supabase/client";
import type {
  AssociationFormData,
  AssociationMercadoPagoConnectResponse,
  AssociationRow,
  AssociationStripeOnboardingResponse,
  AssociationStripeStatusResponse,
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

function formatMonthlyFeeValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";

  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", ".").trim());

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return "";
  }

  return numericValue.toFixed(2).replace(".", ",");
}

function parseMonthlyFeeValue(value: string) {
  const normalized = Number(value.replace(/\s+/g, "").replace(",", "."));

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error("Informe uma mensalidade válida.");
  }

  return Number(normalized.toFixed(2));
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

async function getSignedLogoUrl(path: string | null) {
  if (!path) return null;

  const cleanPath = path.trim();
  if (!cleanPath) return null;

  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .createSignedUrl(cleanPath, 60 * 30);

  if (error) {
    throw new Error("Não foi possível gerar a URL assinada da logo.");
  }

  return data.signedUrl;
}

async function getPrivateSignatureUrl(path: string | null) {
  if (!path) return null;

  const cleanPath = path.trim();
  if (!cleanPath) return null;

  const { data, error } = await supabase.storage
    .from(ASSOCIATION_SIGNATURES_BUCKET)
    .createSignedUrl(cleanPath, 60 * 30);

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
    phone: normalizeNullableText(row.phone),
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
    monthly_fee: formatMonthlyFeeValue(row.monthly_fee),
    stripe_connected_account_id: "",
    stripe_onboarding_completed: false,

    mercadopago_user_id: normalizeNullableText(row.mercadopago_user_id),
    mercadopago_status: row.mercadopago_status ?? "not_connected",
    mercadopago_connected_at: row.mercadopago_connected_at ?? null,
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
        phone,
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
        is_active,
        monthly_fee,
        mercadopago_user_id,
        mercadopago_status,
        mercadopago_connected_at
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
    getSignedLogoUrl(row.logo_path),
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

  const logoUrl = await getSignedLogoUrl(filePath);

  return {
    logoPath: filePath,
    logoUrl,
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
    phone: input.phone.trim() || null,
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
    monthly_fee: parseMonthlyFeeValue(input.monthly_fee),
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
        phone,
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
        is_active,
        monthly_fee,
        mercadopago_user_id,
        mercadopago_status,
        mercadopago_connected_at
      `,
    )
    .single();

  if (error || !data) {
    throw new Error("Não foi possível salvar os dados da associação.");
  }

  return buildAssociationFormDataFromRow(data as AssociationRow);
}

export async function createAssociationStripeOnboarding(): Promise<AssociationStripeOnboardingResponse> {
  const { data, error } = await supabase.functions.invoke(
    "create-association-stripe-onboarding",
    {
      body: {},
    },
  );

  if (error) {
    throw new Error(
      error.message || "Não foi possível iniciar o onboarding da Stripe.",
    );
  }

  if (!data?.url || !data?.mode) {
    throw new Error("A Stripe não retornou um link de onboarding válido.");
  }

  return data as AssociationStripeOnboardingResponse;
}

export async function syncAssociationStripeOnboardingStatus(): Promise<AssociationStripeStatusResponse> {
  const { data, error } = await supabase.functions.invoke(
    "sync-association-stripe-onboarding-status",
    {
      body: {},
    },
  );

  if (error) {
    throw new Error(
      error.message || "Não foi possível sincronizar o status da Stripe.",
    );
  }

  return {
    stripe_connected_account_id: data?.stripe_connected_account_id ?? null,
    stripe_onboarding_completed: Boolean(data?.stripe_onboarding_completed),
    charges_enabled: Boolean(data?.charges_enabled),
    payouts_enabled: Boolean(data?.payouts_enabled),
    details_submitted: Boolean(data?.details_submitted),
    pix_enabled: Boolean(data?.pix_enabled),
    card_payments_enabled: Boolean(data?.card_payments_enabled),
    boleto_enabled: Boolean(data?.boleto_enabled),
    requirements_currently_due: Array.isArray(data?.requirements_currently_due)
      ? data.requirements_currently_due
      : [],
  };
}

export async function createAssociationMercadoPagoConnect(): Promise<AssociationMercadoPagoConnectResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Erro ao verificar sessão atual.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada ou usuário não autenticado.");
  }

  const { data, error } = await supabase.functions.invoke(
    "mercadopago-connect-start",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {},
    },
  );

  if (error) {
    throw new Error(
      error.message || "Não foi possível iniciar a conexão com o Mercado Pago.",
    );
  }

  if (!data?.url) {
    throw new Error(
      "O Mercado Pago não retornou um link de autorização válido.",
    );
  }

  return data as AssociationMercadoPagoConnectResponse;
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

  const logoUrl = await getSignedLogoUrl(data.logo_path);

  return {
    name: data.name,
    community: data.community,
    description: null,
    logo_url: logoUrl,
    banner_url: logoUrl,
  };
}
