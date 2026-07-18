import {
  corsHeaders,
  ensureFeatureAccess,
  getSponsorFromRequest,
  json,
} from "../_shared/sponsor-session.ts";

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

    await ensureFeatureAccess(supabase, sponsor.id, "weekly_ad", "view");

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

    const { data: weeklyAd, error: weeklyAdError } = await supabase
      .from("sponsor_weekly_ads")
      .select("*")
      .eq("sponsor_id", sponsor.id)
      .maybeSingle();

    if (weeklyAdError) {
      return json(
        {
          ok: false,
          message: weeklyAdError.message,
        },
        500,
      );
    }

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

      item: weeklyAd ?? null,

      availableCommunities: normalizedCommunities,

      defaultCommunity:
        weeklyAd?.community ?? sponsor.default_community ?? null,
    });
  } catch (error) {
    console.error("[sponsor-weekly-ad-get] error", error);

    return json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar o encarte.",
      },
      401,
    );
  }
});
