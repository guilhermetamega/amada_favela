function readOptionalEnv(key: string) {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getRequiredEnvWithFallback(key: string, fallback = "") {
  const value = readOptionalEnv(key);
  return value || fallback;
}

export const EXTERNAL_LINKS = {
  LOJAS_WEBSITE: getRequiredEnvWithFallback("VITE_LOJAS_WEBSITE_URL"),
  LOJAS_PLAYSTORE: getRequiredEnvWithFallback("VITE_LOJAS_PLAYSTORE_URL"),
  LOJAS_APPSTORE: getRequiredEnvWithFallback("VITE_LOJAS_APPSTORE_URL"),

  PRIVACY_POLICY_URL: getRequiredEnvWithFallback(
    "VITE_PRIVACY_POLICY_URL",
    "https://amada-favela.vercel.app/privacy",
  ),
  TERMS_OF_USE_URL: getRequiredEnvWithFallback(
    "VITE_TERMS_OF_USE_URL",
    "https://amada-favela.vercel.app/terms",
  ),
};
