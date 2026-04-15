import { supabase } from "@/services/supabase/client";
import type { SponsorWeeklyAd } from "@/types/sponsor-weekly-ad";
import type { SponsorStoreBanner } from "@/types/sponsor-store-banner";

export type DashboardSponsorBannerItem = SponsorStoreBanner & {
  selectedFeatureKeys: string[];
  weeklyAd: SponsorWeeklyAd | null;
};

type DashboardSponsorBannerAction = {
  type: "weekly_ad";
  weeklyAd: SponsorWeeklyAd;
} | null;

const ACTION_PRIORITY = ["weekly_ad"] as const;

export function resolveDashboardSponsorBannerAction(
  item: DashboardSponsorBannerItem,
): DashboardSponsorBannerAction {
  for (const actionKey of ACTION_PRIORITY) {
    if (
      actionKey === "weekly_ad" &&
      item.selectedFeatureKeys.includes("weekly_ad") &&
      item.weeklyAd
    ) {
      return {
        type: "weekly_ad",
        weeklyAd: item.weeklyAd,
      };
    }
  }

  return null;
}

export async function getDashboardSponsorBanners() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: banners, error: bannersError } = await supabase
    .from("sponsor_store_banners")
    .select("*")
    .order("updated_at", { ascending: false });

  if (bannersError) {
    throw new Error(bannersError.message);
  }

  const safeBanners = (banners ?? []) as SponsorStoreBanner[];

  if (safeBanners.length === 0) {
    return [];
  }

  const bannerIds = safeBanners.map((item) => item.id);
  const sponsorIds = safeBanners.map((item) => item.sponsor_id);

  const { data: links, error: linksError } = await supabase
    .from("sponsor_store_banner_features")
    .select("banner_id, feature_key")
    .in("banner_id", bannerIds);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const { data: weeklyAds, error: weeklyAdsError } = await supabase
    .from("sponsor_weekly_ads")
    .select("*")
    .in("sponsor_id", sponsorIds)
    .gte("valid_until", today);

  if (weeklyAdsError) {
    throw new Error(weeklyAdsError.message);
  }

  const featureMap = new Map<string, string[]>();
  for (const link of links ?? []) {
    const current = featureMap.get(link.banner_id) ?? [];
    current.push(link.feature_key);
    featureMap.set(link.banner_id, current);
  }

  const weeklyAdMap = new Map<string, SponsorWeeklyAd>();
  for (const item of (weeklyAds ?? []) as SponsorWeeklyAd[]) {
    weeklyAdMap.set(item.sponsor_id, item);
  }

  return safeBanners
    .map<DashboardSponsorBannerItem>((banner) => ({
      ...banner,
      selectedFeatureKeys: featureMap.get(banner.id) ?? [],
      weeklyAd: weeklyAdMap.get(banner.sponsor_id) ?? null,
    }))
    .filter((item) => !!resolveDashboardSponsorBannerAction(item));
}
