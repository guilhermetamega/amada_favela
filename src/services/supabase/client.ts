import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIG_ERROR =
  !supabaseUrl || !supabaseAnonKey
    ? "Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de deploy."
    : null;

if (SUPABASE_CONFIG_ERROR) {
  console.error(`[supabase] ${SUPABASE_CONFIG_ERROR}`);
}

export const supabase = createClient(
  supabaseUrl || "https://invalid-project.supabase.co",
  supabaseAnonKey || "invalid-anon-key",
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  },
);
