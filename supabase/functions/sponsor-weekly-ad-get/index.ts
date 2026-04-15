import {
  corsHeaders,
  ensureFeatureAccess,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    await ensureFeatureAccess(supabase, sponsor.id, "weekly_ad", "view");

    const { data, error } = await supabase
      .from("sponsor_weekly_ads")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (error) {
      return json({ ok: false, message: error.message }, 500);
    }

    return json({
      ok: true,
      item: data ?? null,
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
