export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL?.trim() ?? "",
};

export function getPublicAppUrl() {
  const configuredUrl = env.publicAppUrl.replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  throw new Error("A variável VITE_PUBLIC_APP_URL não está configurada.");
}

export function buildPublicAppUrl(path: string) {
  const baseUrl = getPublicAppUrl();
  const normalizedPath = path.replace(/^\/+/, "");

  return new URL(normalizedPath, `${baseUrl}/`).toString();
}
