import {
  corsHeaders,
  ensureFeatureAccess,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

type AvailableFeatureRow = {
  feature_key: string;
  can_view: boolean;
  sponsor_features: {
    key: string;
    label: string;
    description: string | null;
    icon: string | null;
    route: string | null;
    is_active: boolean;
    sort_order: number;
  };
};

type CommunityOptionRow = {
  key: string;
  label: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "GET") {
    return json(
      {
        ok: false,
        message: "Método não permitido.",
      },
      405,
    );
  }

  try {
    const { supabase, sponsor } = await getSponsorFromRequest(req);

    await ensureFeatureAccess(supabase, sponsor.id, "store_banner", "view");

    const { data: availableCommunities, error: communitiesError } =
      await supabase
        .from("communities")
        .select("key, label")
        .eq("active", true)
        .order("label", {
          ascending: true,
        });

    if (communitiesError) {
      return json(
        {
          ok: false,
          message: communitiesError.message,
        },
        500,
      );
    }

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
      return json(
        {
          ok: false,
          message: availableFeaturesError.message,
        },
        500,
      );
    }

    const { data: banner, error: bannerError } = await supabase
      .from("sponsor_store_banners")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (bannerError) {
      return json(
        {
          ok: false,
          message: bannerError.message,
        },
        500,
      );
    }

    let selectedFeatureKeys: string[] = [];

    if (banner) {
      const { data: links, error: linksError } = await supabase
        .from("sponsor_store_banner_features")
        .select("feature_key")
        .eq("banner_id", banner.id);

      if (linksError) {
        return json(
          {
            ok: false,
            message: linksError.message,
          },
          500,
        );
      }

      selectedFeatureKeys = (links ?? [])
        .map((item) => item.feature_key)
        .filter(
          (featureKey): featureKey is string =>
            typeof featureKey === "string" && featureKey.trim().length > 0,
        );
    }

    const normalizedFeatures = (
      (availableFeatures ?? []) as unknown as AvailableFeatureRow[]
    )
      .map((item) => ({
        key: item.sponsor_features.key,
        label: item.sponsor_features.label,
        description: item.sponsor_features.description,
        icon: item.sponsor_features.icon,
        route: item.sponsor_features.route,
        sort_order: item.sponsor_features.sort_order,
      }))
      .sort((first, second) => first.sort_order - second.sort_order);

    const normalizedCommunities = (
      (availableCommunities ?? []) as CommunityOptionRow[]
    )
      .map((community) => ({
        key: community.key,
        label: community.label,
      }))
      .filter((community) =>
        Boolean(community.key?.trim() && community.label?.trim()),
      );

    return json({
      ok: true,

      item: banner ?? null,

      selectedFeatureKeys,

      availableFeatures: normalizedFeatures,

      availableCommunities: normalizedCommunities,

      defaultCommunity: banner?.community ?? sponsor.default_community ?? null,
    });
  } catch (error) {
    console.error("[sponsor-store-banner-get] error", error);

    return json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar o banner.",
      },
      401,
    );
  }
});
