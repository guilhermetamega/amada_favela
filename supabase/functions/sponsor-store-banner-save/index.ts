import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-store-banners";
const LOG_PREFIX = "[sponsor-store-banner-save]";

type ExistingBannerRow = {
  id: string;
  sponsor_id: string;
  community: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type CommunityRow = {
  key: string;
  label: string;
  active: boolean;
};

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return sanitized || "banner";
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.trim().toLowerCase();

  if (extension) {
    return extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/gif") {
    return "gif";
  }

  return "jpg";
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo do banner precisa ser uma imagem.");
  }

  const maximumSizeInBytes = 10 * 1024 * 1024;

  if (file.size > maximumSizeInBytes) {
    throw new Error("A imagem do banner deve possuir no máximo 10 MB.");
  }
}

function parseSelectedFeatureKeys(rawSelected: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawSelected);
  } catch {
    throw new Error("Seleção de funções inválida.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Seleção de funções inválida.");
  }

  return [
    ...new Set(
      parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

async function validateCommunity(
  supabase: Awaited<ReturnType<typeof getSponsorFromRequest>>["supabase"],
  community: string,
): Promise<CommunityRow> {
  const { data, error } = await supabase
    .from("communities")
    .select("key, label, active")
    .eq("key", community)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível validar a comunidade: ${error.message}`);
  }

  if (!data) {
    throw new Error("A comunidade selecionada não existe ou está inativa.");
  }

  return data as CommunityRow;
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof getSponsorFromRequest>>["supabase"],
  sponsorId: string,
  file: File,
) {
  validateImageFile(file);

  const extension = getFileExtension(file);

  const baseName = file.name.replace(/\.[^/.]+$/, "");

  const safeName = sanitizeFileName(baseName);

  const path =
    `${sponsorId}/store-banner/` +
    `${Date.now()}-${crypto.randomUUID()}-` +
    `${safeName}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(
      `Não foi possível enviar a imagem do banner: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    imageUrl: data.publicUrl,
    storagePath: path,
  };
}

async function removeStorageFile(
  supabase: Awaited<ReturnType<typeof getSponsorFromRequest>>["supabase"],
  storagePath: string | null,
) {
  if (!storagePath) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) {
    log("storage:remove-warning", {
      storagePath,
      message: error.message,
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      {
        ok: false,
        message: "Método não permitido.",
      },
      405,
    );
  }

  let uploadedStoragePath: string | null = null;

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    const { data: existingData, error: existingError } = await supabase
      .from("sponsor_store_banners")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (existingError) {
      return json(
        {
          ok: false,
          message: existingError.message,
        },
        500,
      );
    }

    const existing = existingData as ExistingBannerRow | null;

    await ensureFeatureAccess(
      supabase,
      sponsor.id,
      "store_banner",
      existing ? "update" : "create",
    );

    const formData = await req.formData();

    const community = String(formData.get("community") ?? "").trim();

    const rawSelected = String(formData.get("selectedFeatureKeys") ?? "[]");

    const image = formData.get("image");

    if (!community) {
      return json(
        {
          ok: false,
          message: "Selecione a comunidade da propaganda.",
        },
        400,
      );
    }

    let selectedFeatureKeys: string[];

    try {
      selectedFeatureKeys = parseSelectedFeatureKeys(rawSelected);
    } catch (error) {
      return json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Seleção de funções inválida.",
        },
        400,
      );
    }

    if (selectedFeatureKeys.length === 0) {
      return json(
        {
          ok: false,
          message: "Selecione ao menos uma função para o banner.",
        },
        400,
      );
    }

    let selectedCommunity: CommunityRow;

    try {
      selectedCommunity = await validateCommunity(supabase, community);
    } catch (error) {
      return json(
        {
          ok: false,
          message:
            error instanceof Error ? error.message : "Comunidade inválida.",
        },
        400,
      );
    }

    const { data: allowedFeatures, error: allowedFeaturesError } =
      await supabase
        .from("sponsor_feature_access")
        .select("feature_key")
        .eq("sponsor_id", sponsor.id)
        .eq("can_view", true);

    if (allowedFeaturesError) {
      return json(
        {
          ok: false,
          message: allowedFeaturesError.message,
        },
        500,
      );
    }

    const allowedKeys = new Set(
      (allowedFeatures ?? [])
        .map((item) => item.feature_key)
        .filter(
          (key): key is string =>
            typeof key === "string" && key !== "store_banner",
        ),
    );

    const invalidKeys = selectedFeatureKeys.filter(
      (key) => !allowedKeys.has(key),
    );

    if (invalidKeys.length > 0) {
      return json(
        {
          ok: false,
          message: "Há funções selecionadas que não estão liberadas.",
          invalidFeatureKeys: invalidKeys,
        },
        403,
      );
    }

    let imageUrl = existing?.image_url ?? null;

    if (image instanceof File && image.size > 0) {
      const uploaded = await uploadImage(supabase, sponsor.id, image);

      imageUrl = uploaded.imageUrl;

      uploadedStoragePath = uploaded.storagePath;
    }

    if (!imageUrl) {
      return json(
        {
          ok: false,
          message: "Envie a imagem do banner.",
        },
        400,
      );
    }

    const { data: savedBanner, error: saveError } = await supabase
      .from("sponsor_store_banners")
      .upsert(
        {
          sponsor_id: sponsor.id,
          community: selectedCommunity.key,
          image_url: imageUrl,
        },
        {
          onConflict: "sponsor_id",
        },
      )
      .select("*")
      .single();

    if (saveError || !savedBanner) {
      await removeStorageFile(supabase, uploadedStoragePath);

      return json(
        {
          ok: false,
          message: saveError?.message ?? "Não foi possível salvar o banner.",
        },
        500,
      );
    }

    const { error: sponsorUpdateError } = await supabase
      .from("sponsors")
      .update({
        default_community: selectedCommunity.key,
      })
      .eq("id", sponsor.id);

    if (sponsorUpdateError) {
      log("sponsor-default-community:update-warning", {
        sponsorId: sponsor.id,
        community: selectedCommunity.key,
        message: sponsorUpdateError.message,
      });
    }

    const { error: deleteLinksError } = await supabase
      .from("sponsor_store_banner_features")
      .delete()
      .eq("banner_id", savedBanner.id);

    if (deleteLinksError) {
      return json(
        {
          ok: false,
          message: deleteLinksError.message,
        },
        500,
      );
    }

    const featureRows = selectedFeatureKeys.map((featureKey) => ({
      banner_id: savedBanner.id,
      feature_key: featureKey,
    }));

    const { error: insertLinksError } = await supabase
      .from("sponsor_store_banner_features")
      .insert(featureRows);

    if (insertLinksError) {
      return json(
        {
          ok: false,
          message: insertLinksError.message,
        },
        500,
      );
    }

    if (existing?.image_url && existing.image_url !== imageUrl) {
      const oldPath = extractStoragePathFromPublicUrl(
        existing.image_url,
        BUCKET,
      );

      await removeStorageFile(supabase, oldPath);
    }

    log("banner:saved", {
      sponsorId: sponsor.id,
      bannerId: savedBanner.id,
      community: selectedCommunity.key,
      selectedFeatureKeys,
      imageChanged: existing?.image_url !== imageUrl,
    });

    return json({
      ok: true,
      item: savedBanner,
      selectedFeatureKeys,
      defaultCommunity: selectedCommunity.key,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} fatal`, error);

    return json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar o banner.",
      },
      401,
    );
  }
});
