import {
  corsHeaders,
  ensureFeatureAccess,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    await ensureFeatureAccess(supabase, sponsor.id, "store_banner", "view");

    const { data: availableFeatures, error: availableFeaturesError } =
      await supabase
        .from("sponsor_feature_access")
        .select(
          `
        feature_key,
        can_view,
        sponsor_features!inner (
          key,
          label,
          description,
          icon,
          route,
          is_active,
          sort_order
        )
      `,
        )
        .eq("sponsor_id", sponsor.id)
        .eq("can_view", true)
        .eq("sponsor_features.is_active", true)
        .neq("feature_key", "store_banner");

    if (availableFeaturesError) {
      return json({ ok: false, message: availableFeaturesError.message }, 500);
    }

    const { data: banner, error: bannerError } = await supabase
      .from("sponsor_store_banners")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (bannerError) {
      return json({ ok: false, message: bannerError.message }, 500);
    }

    let selectedFeatureKeys: string[] = [];

    if (banner) {
      const { data: links, error: linksError } = await supabase
        .from("sponsor_store_banner_features")
        .select("feature_key")
        .eq("banner_id", banner.id);

      if (linksError) {
        return json({ ok: false, message: linksError.message }, 500);
      }

      selectedFeatureKeys = (links ?? []).map((item) => item.feature_key);
    }

    return json({
      ok: true,
      item: banner ?? null,
      selectedFeatureKeys,
      availableFeatures: (availableFeatures ?? [])
        .map((item: any) => ({
          key: item.sponsor_features.key,
          label: item.sponsor_features.label,
          description: item.sponsor_features.description,
          icon: item.sponsor_features.icon,
          route: item.sponsor_features.route,
          sort_order: item.sponsor_features.sort_order,
        }))
        .sort((a: any, b: any) => a.sort_order - b.sort_order),
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
