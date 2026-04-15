import {
  corsHeaders,
  ensureFeatureAccess,
  extractStoragePathFromPublicUrl,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

const BUCKET = "sponsor-weekly-ads";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    await ensureFeatureAccess(supabase, sponsor.id, "weekly_ad", "delete");

    const { data: existing, error: existingError } = await supabase
      .from("sponsor_weekly_ads")
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
      .from("sponsor_weekly_ads")
      .delete()
      .eq("sponsor_id", sponsor.id);

    if (deleteError) {
      return json({ ok: false, message: deleteError.message }, 500);
    }

    const primaryPath = extractStoragePathFromPublicUrl(
      existing.image_primary_url,
      BUCKET,
    );
    const secondaryPath = extractStoragePathFromPublicUrl(
      existing.image_secondary_url,
      BUCKET,
    );

    const paths = [primaryPath, secondaryPath].filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
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
