import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-weekly-ads";

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
  prefix: string,
) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const path = `${sponsorId}/weekly-ad/${prefix}-${Date.now()}-${safeName}.${ext}`;

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    const { data: existing, error: existingError } = await supabase
      .from("sponsor_weekly_ads")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (existingError) {
      return json({ ok: false, message: existingError.message }, 500);
    }

    await ensureFeatureAccess(
      supabase,
      sponsor.id,
      "weekly_ad",
      existing ? "update" : "create",
    );

    const formData = await req.formData();

    const storeName = String(formData.get("storeName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const validUntil = String(formData.get("validUntil") ?? "").trim();

    const imagePrimary = formData.get("imagePrimary");
    const imageSecondary = formData.get("imageSecondary");

    if (!storeName) {
      return json({ ok: false, message: "Informe o nome da loja." }, 400);
    }

    if (!phone) {
      return json({ ok: false, message: "Informe o telefone/WhatsApp." }, 400);
    }

    if (!validUntil) {
      return json(
        { ok: false, message: "Informe a validade do encarte." },
        400,
      );
    }

    let primaryUrl = existing?.image_primary_url ?? null;
    let secondaryUrl = existing?.image_secondary_url ?? null;

    if (imagePrimary instanceof File && imagePrimary.size > 0) {
      primaryUrl = await uploadImage(
        supabase,
        sponsor.id,
        imagePrimary,
        "primary",
      );
    }

    if (imageSecondary instanceof File && imageSecondary.size > 0) {
      secondaryUrl = await uploadImage(
        supabase,
        sponsor.id,
        imageSecondary,
        "secondary",
      );
    }

    if (!primaryUrl || !secondaryUrl) {
      return json(
        { ok: false, message: "As duas imagens do encarte são obrigatórias." },
        400,
      );
    }

    const payload = {
      sponsor_id: sponsor.id,
      store_name: storeName,
      phone,
      image_primary_url: primaryUrl,
      image_secondary_url: secondaryUrl,
      valid_until: validUntil,
    };

    const { data, error } = await supabase
      .from("sponsor_weekly_ads")
      .upsert(payload, { onConflict: "sponsor_id" })
      .select("*")
      .single();

    if (error) {
      return json({ ok: false, message: error.message }, 500);
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

      const pathsToDelete = [
        oldPrimaryPath && oldPrimaryPath !== newPrimaryPath
          ? oldPrimaryPath
          : null,
        oldSecondaryPath && oldSecondaryPath !== newSecondaryPath
          ? oldSecondaryPath
          : null,
      ].filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        await supabase.storage.from(BUCKET).remove(pathsToDelete);
      }
    }

    return json({
      ok: true,
      item: data,
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
