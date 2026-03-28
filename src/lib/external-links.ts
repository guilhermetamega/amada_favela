function getEnv(key: string) {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Variável de ambiente não definida: ${key}`);
  }

  return value;
}

export const EXTERNAL_LINKS = {
  LOJAS_WEBSITE: getEnv("VITE_LOJAS_WEBSITE_URL"),
  LOJAS_PLAYSTORE: getEnv("VITE_LOJAS_PLAYSTORE_URL"),
  LOJAS_APPSTORE: getEnv("VITE_LOJAS_APPSTORE_URL"),
};
