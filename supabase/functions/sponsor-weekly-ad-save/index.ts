import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-weekly-ads";
const LOG_PREFIX = "[sponsor-weekly-ad-save]";

type ExistingWeeklyAdRow = {
  id: string;
  sponsor_id: string;
  community: string | null;
  store_name: string;
  phone: string;
  image_primary_url: string;
  image_secondary_url: string;
  valid_until: string;
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

  return sanitized || "encarte";
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

function validateImageFile(file: File, label: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${label} precisa ser um arquivo de imagem.`);
  }

  const maximumSizeInBytes = 10 * 1024 * 1024;

  if (file.size > maximumSizeInBytes) {
    throw new Error(`${label} deve possuir no máximo 10 MB.`);
  }
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);

  return !Number.isNaN(date.getTime());
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
  prefix: "primary" | "secondary",
) {
  validateImageFile(
    file,
    prefix === "primary" ? "A imagem principal" : "A imagem secundária",
  );

  const extension = getFileExtension(file);

  const baseName = file.name.replace(/\.[^/.]+$/, "");

  const safeName = sanitizeFileName(baseName);

  const path =
    `${sponsorId}/weekly-ad/` +
    `${prefix}-${Date.now()}-` +
    `${crypto.randomUUID()}-` +
    `${safeName}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(
      `Não foi possível enviar ${
        prefix === "primary" ? "a imagem principal" : "a imagem secundária"
      }: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    imageUrl: data.publicUrl,
    storagePath: path,
  };
}

async function removeStorageFiles(
  supabase: Awaited<ReturnType<typeof getSponsorFromRequest>>["supabase"],
  storagePaths: Array<string | null>,
) {
  const validPaths = [
    ...new Set(
      storagePaths.filter(
        (path): path is string =>
          typeof path === "string" && path.trim().length > 0,
      ),
    ),
  ];

  if (validPaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove(validPaths);

  if (error) {
    log("storage:remove-warning", {
      storagePaths: validPaths,
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

  const newlyUploadedPaths: string[] = [];

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    const { data: existingData, error: existingError } = await supabase
      .from("sponsor_weekly_ads")
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

    const existing = existingData as ExistingWeeklyAdRow | null;

    await ensureFeatureAccess(
      supabase,
      sponsor.id,
      "weekly_ad",
      existing ? "update" : "create",
    );

    const formData = await req.formData();

    const community = String(formData.get("community") ?? "").trim();

    const storeName = String(formData.get("storeName") ?? "").trim();

    const phone = normalizePhone(String(formData.get("phone") ?? ""));

    const validUntil = String(formData.get("validUntil") ?? "").trim();

    const imagePrimary = formData.get("imagePrimary");

    const imageSecondary = formData.get("imageSecondary");

    if (!community) {
      return json(
        {
          ok: false,
          message: "Selecione a comunidade da propaganda.",
        },
        400,
      );
    }

    if (!storeName) {
      return json(
        {
          ok: false,
          message: "Informe o nome da loja.",
        },
        400,
      );
    }

    if (!phone) {
      return json(
        {
          ok: false,
          message: "Informe o telefone ou WhatsApp.",
        },
        400,
      );
    }

    if (!validUntil) {
      return json(
        {
          ok: false,
          message: "Informe a validade do encarte.",
        },
        400,
      );
    }

    if (!isValidDateString(validUntil)) {
      return json(
        {
          ok: false,
          message: "A validade do encarte possui formato inválido.",
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

    let primaryUrl = existing?.image_primary_url ?? null;

    let secondaryUrl = existing?.image_secondary_url ?? null;

    if (imagePrimary instanceof File && imagePrimary.size > 0) {
      const uploaded = await uploadImage(
        supabase,
        sponsor.id,
        imagePrimary,
        "primary",
      );

      primaryUrl = uploaded.imageUrl;

      newlyUploadedPaths.push(uploaded.storagePath);
    }

    if (imageSecondary instanceof File && imageSecondary.size > 0) {
      const uploaded = await uploadImage(
        supabase,
        sponsor.id,
        imageSecondary,
        "secondary",
      );

      secondaryUrl = uploaded.imageUrl;

      newlyUploadedPaths.push(uploaded.storagePath);
    }

    if (!primaryUrl || !secondaryUrl) {
      await removeStorageFiles(supabase, newlyUploadedPaths);

      return json(
        {
          ok: false,
          message: "As duas imagens do encarte são obrigatórias.",
        },
        400,
      );
    }

    const payload = {
      sponsor_id: sponsor.id,
      community: selectedCommunity.key,
      store_name: storeName,
      phone,
      image_primary_url: primaryUrl,
      image_secondary_url: secondaryUrl,
      valid_until: validUntil,
    };

    const { data: savedWeeklyAd, error: saveError } = await supabase
      .from("sponsor_weekly_ads")
      .upsert(payload, {
        onConflict: "sponsor_id",
      })
      .select("*")
      .single();

    if (saveError || !savedWeeklyAd) {
      await removeStorageFiles(supabase, newlyUploadedPaths);

      return json(
        {
          ok: false,
          message: saveError?.message ?? "Não foi possível salvar o encarte.",
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

    if (existing) {
      const oldPrimaryPath = extractStoragePathFromPublicUrl(
        existing.image_primary_url,
        BUCKET,
      );

      const oldSecondaryPath = extractStoragePathFromPublicUrl(
        existing.image_secondary_url,
        BUCKET,
      );

      const newPrimaryPath = extractStoragePathFromPublicUrl(
        primaryUrl,
        BUCKET,
      );

      const newSecondaryPath = extractStoragePathFromPublicUrl(
        secondaryUrl,
        BUCKET,
      );

      const oldPathsToDelete = [
        oldPrimaryPath && oldPrimaryPath !== newPrimaryPath
          ? oldPrimaryPath
          : null,

        oldSecondaryPath && oldSecondaryPath !== newSecondaryPath
          ? oldSecondaryPath
          : null,
      ];

      await removeStorageFiles(supabase, oldPathsToDelete);
    }

    log("weekly-ad:saved", {
      sponsorId: sponsor.id,
      weeklyAdId: savedWeeklyAd.id,
      community: selectedCommunity.key,
      validUntil,
      primaryImageChanged: existing?.image_primary_url !== primaryUrl,
      secondaryImageChanged: existing?.image_secondary_url !== secondaryUrl,
    });

    return json({
      ok: true,
      item: savedWeeklyAd,
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
            : "Erro inesperado ao salvar o encarte.",
      },
      401,
    );
  }
});
