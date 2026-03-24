export const CACHE_KEYS = {
  dashboardWarnings: "dashboard-warnings",
  associationHero: "association-hero",
} as const;

export const CACHE_TTL = {
  dashboardWarnings: 1000 * 60 * 5,
  associationHero: 1000 * 60 * 10,
} as const;
