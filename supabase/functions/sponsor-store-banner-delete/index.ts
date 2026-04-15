import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-store-banners";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    await ensureFeatureAccess(supabase, sponsor.id, "store_banner", "delete");

    const { data: existing, error: existingError } = await supabase
      .from("sponsor_store_banners")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (existingError) {
      return json({ ok: false, message: existingError.message }, 500);
    }

    if (!existing) {
      return json({ ok: true, deleted: false });
    }

    const { error: deleteError } = await supabase
      .from("sponsor_store_banners")
      .delete()
      .eq("sponsor_id", sponsor.id);

    if (deleteError) {
      return json({ ok: false, message: deleteError.message }, 500);
    }

    const path = extractStoragePathFromPublicUrl(existing.image_url, BUCKET);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    return json({
      ok: true,
      deleted: true,
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
