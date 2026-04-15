import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-store-banners";

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof getSponsorFromRequest>>["supabase"],
  sponsorId: string,
  file: File,
) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const path = `${sponsorId}/store-banner/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    const { data: existing, error: existingError } = await supabase
      .from("sponsor_store_banners")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (existingError) {
      return json({ ok: false, message: existingError.message }, 500);
    }

    await ensureFeatureAccess(
      supabase,
      sponsor.id,
      "store_banner",
      existing ? "update" : "create",
    );

    const formData = await req.formData();

    const rawSelected = String(formData.get("selectedFeatureKeys") ?? "[]");
    const image = formData.get("image");

    let selectedFeatureKeys: string[] = [];

    try {
      const parsed = JSON.parse(rawSelected);
      if (Array.isArray(parsed)) {
        selectedFeatureKeys = parsed
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return json({ ok: false, message: "Seleção de funções inválida." }, 400);
    }

    if (selectedFeatureKeys.length === 0) {
      return json(
        { ok: false, message: "Selecione ao menos uma função para o banner." },
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
      return json({ ok: false, message: allowedFeaturesError.message }, 500);
    }

    const allowedKeys = new Set(
      (allowedFeatures ?? [])
        .map((item) => item.feature_key)
        .filter((key) => key !== "store_banner"),
    );

    const hasInvalidKey = selectedFeatureKeys.some(
      (key) => !allowedKeys.has(key),
    );
    if (hasInvalidKey) {
      return json(
        {
          ok: false,
          message: "Há funções selecionadas que não estão liberadas.",
        },
        403,
      );
    }

    let imageUrl = existing?.image_url ?? null;

    if (image instanceof File && image.size > 0) {
      imageUrl = await uploadImage(supabase, sponsor.id, image);
    }

    if (!imageUrl) {
      return json({ ok: false, message: "Envie a imagem do banner." }, 400);
    }

    const { data: savedBanner, error: saveError } = await supabase
      .from("sponsor_store_banners")
      .upsert(
        {
          sponsor_id: sponsor.id,
          image_url: imageUrl,
        },
        { onConflict: "sponsor_id" },
      )
      .select("*")
      .single();

    if (saveError) {
      return json({ ok: false, message: saveError.message }, 500);
    }

    const { error: deleteLinksError } = await supabase
      .from("sponsor_store_banner_features")
      .delete()
      .eq("banner_id", savedBanner.id);

    if (deleteLinksError) {
      return json({ ok: false, message: deleteLinksError.message }, 500);
    }

    const rows = selectedFeatureKeys.map((featureKey) => ({
      banner_id: savedBanner.id,
      feature_key: featureKey,
    }));

    const { error: insertLinksError } = await supabase
      .from("sponsor_store_banner_features")
      .insert(rows);

    if (insertLinksError) {
      return json({ ok: false, message: insertLinksError.message }, 500);
    }

    if (existing?.image_url && existing.image_url !== imageUrl) {
      const oldPath = extractStoragePathFromPublicUrl(
        existing.image_url,
        BUCKET,
      );
      if (oldPath) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }
    }

    return json({
      ok: true,
      item: savedBanner,
      selectedFeatureKeys,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Erro inesperado.",
      },
      401,
    );
  }
});
