// src/services/sponsorAuth.ts
import { supabase } from "@/services/supabase/client";
import type { SponsorLoginResponse } from "@/types/sponsors";

export async function sponsorLogin(email: string, birth: string) {
  const { data, error } = await supabase.functions.invoke<SponsorLoginResponse>(
    "sponsor-login",
    {
      body: { email, birth },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
