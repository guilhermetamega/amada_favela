import { supabase } from "@/services/supabase/client";

import type { SponsorStoreBanner } from "@/types/sponsor-store-banner";
import type { SponsorWeeklyAd } from "@/types/sponsor-weekly-ad";

export type DashboardSponsorBannerItem = SponsorStoreBanner & {
  selectedFeatureKeys: string[];
  weeklyAd: SponsorWeeklyAd | null;
};

type DashboardSponsorBannerAction = {
  type: "weekly_ad";
  weeklyAd: SponsorWeeklyAd;
} | null;

type UserCommunityRow = {
  comunity: string | null;
};

type BannerFeatureLinkRow = {
  banner_id: string;
  feature_key: string | null;
};

const ACTION_PRIORITY = ["weekly_ad"] as const;

/**
 * Retorna a data atual no formato YYYY-MM-DD,
 * considerando o fuso horário oficial do projeto.
 *
 * Isso evita diferenças de data causadas pelo uso
 * direto de Date.toISOString(), que utiliza UTC.
 */
function getTodayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeCommunity(value: string | null | undefined) {
  return value?.trim() ?? "";
}

/**
 * Resolve a ação executada quando o usuário
 * clicar em um banner.
 *
 * No fluxo atual, o banner pode abrir o encarte
 * semanal do mesmo patrocinador.
 */
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

/**
 * Carrega os banners destinados exclusivamente
 * à comunidade do usuário autenticado.
 *
 * Regras:
 *
 * 1. O usuário precisa estar autenticado.
 * 2. O perfil precisa possuir uma comunidade.
 * 3. O banner precisa pertencer à mesma comunidade.
 * 4. O encarte precisa pertencer à mesma comunidade.
 * 5. O encarte precisa estar dentro da validade.
 * 6. O banner precisa possuir uma ação válida.
 */
export async function getDashboardSponsorBanners(): Promise<
  DashboardSponsorBannerItem[]
> {
  const today = getTodayInSaoPaulo();

  /*
   * Descobre o usuário autenticado.
   */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(
      `Não foi possível identificar o usuário: ${authError.message}`,
    );
  }

  if (!user) {
    return [];
  }

  /*
   * Busca a comunidade do perfil.
   *
   * O nome "comunity" é mantido porque corresponde
   * ao campo existente na tabela public.users.
   */
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("comunity")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Não foi possível carregar a comunidade do usuário: ${profileError.message}`,
    );
  }

  const profile = profileData as UserCommunityRow | null;

  const community = normalizeCommunity(profile?.comunity);

  /*
   * Usuários sem comunidade não recebem propagandas
   * segmentadas.
   */
  if (!community) {
    return [];
  }

  /*
   * Busca somente banners publicados para a
   * comunidade do usuário.
   */
  const { data: bannersData, error: bannersError } = await supabase
    .from("sponsor_store_banners")
    .select("*")
    .eq("community", community)
    .order("updated_at", {
      ascending: false,
    });

  if (bannersError) {
    throw new Error(
      `Não foi possível carregar os banners: ${bannersError.message}`,
    );
  }

  const banners = (bannersData ?? []) as SponsorStoreBanner[];

  if (banners.length === 0) {
    return [];
  }

  const bannerIds = banners.map((banner) => banner.id);

  /*
   * Remove IDs duplicados antes da consulta dos
   * encartes.
   */
  const sponsorIds = [...new Set(banners.map((banner) => banner.sponsor_id))];

  /*
   * Busca as funcionalidades associadas aos
   * banners já filtrados.
   */
  const { data: linksData, error: linksError } = await supabase
    .from("sponsor_store_banner_features")
    .select("banner_id, feature_key")
    .in("banner_id", bannerIds);

  if (linksError) {
    throw new Error(
      `Não foi possível carregar as ações dos banners: ${linksError.message}`,
    );
  }

  /*
   * Busca somente encartes:
   *
   * - dos patrocinadores encontrados;
   * - da mesma comunidade do usuário;
   * - ainda dentro da validade.
   */
  const { data: weeklyAdsData, error: weeklyAdsError } = await supabase
    .from("sponsor_weekly_ads")
    .select("*")
    .in("sponsor_id", sponsorIds)
    .eq("community", community)
    .gte("valid_until", today)
    .order("updated_at", {
      ascending: false,
    });

  if (weeklyAdsError) {
    throw new Error(
      `Não foi possível carregar os encartes: ${weeklyAdsError.message}`,
    );
  }

  const links = (linksData ?? []) as BannerFeatureLinkRow[];

  const weeklyAds = (weeklyAdsData ?? []) as SponsorWeeklyAd[];

  /*
   * Organiza as funcionalidades por banner.
   */
  const featureMap = new Map<string, string[]>();

  for (const link of links) {
    const featureKey = link.feature_key?.trim();

    if (!featureKey) {
      continue;
    }

    const currentFeatures = featureMap.get(link.banner_id) ?? [];

    if (!currentFeatures.includes(featureKey)) {
      currentFeatures.push(featureKey);
    }

    featureMap.set(link.banner_id, currentFeatures);
  }

  /*
   * Organiza os encartes por patrocinador.
   *
   * Como a consulta está ordenada por updated_at
   * decrescente, o primeiro registro encontrado é
   * o mais recentemente atualizado.
   */
  const weeklyAdMap = new Map<string, SponsorWeeklyAd>();

  for (const weeklyAd of weeklyAds) {
    if (!weeklyAdMap.has(weeklyAd.sponsor_id)) {
      weeklyAdMap.set(weeklyAd.sponsor_id, weeklyAd);
    }
  }

  /*
   * Monta os itens exibidos pelo Dashboard e
   * elimina banners sem ação disponível.
   */
  return banners
    .map<DashboardSponsorBannerItem>((banner) => ({
      ...banner,

      selectedFeatureKeys: featureMap.get(banner.id) ?? [],

      weeklyAd: weeklyAdMap.get(banner.sponsor_id) ?? null,
    }))
    .filter((item) => Boolean(resolveDashboardSponsorBannerAction(item)));
}
