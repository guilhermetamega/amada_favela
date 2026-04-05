import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@latest?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type UserRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};

type AssociationRow = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  stripe_connected_account_id: string | null;
  stripe_onboarding_completed: boolean | null;
  is_active: boolean;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(401, { error: "Não autenticado." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const appBaseUrl = Deno.env.get("APP_BASE_URL");

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !stripeSecret ||
      !appBaseUrl
    ) {
      throw new Error("Variáveis obrigatórias do servidor não configuradas.");
    }

    const stripe = new Stripe(stripeSecret);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return json(401, { error: "Sessão inválida." });
    }

    const { data: userData, error: userError } = await admin
      .from("users")
      .select("id, role, comunity")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return json(404, { error: "Usuário não encontrado." });
    }

    const user = userData as UserRow;

    if (!["admin", "president"].includes(user.role ?? "")) {
      return json(403, {
        error: "Você não pode configurar a Stripe da associação.",
      });
    }

    if (!user.comunity) {
      return json(400, { error: "Usuário sem comunidade vinculada." });
    }

    const { data: associationData, error: associationError } = await admin
      .from("association")
      .select(
        "id, name, cnpj, community, stripe_connected_account_id, stripe_onboarding_completed, is_active",
      )
      .eq("community", user.comunity)
      .eq("is_active", true)
      .single();

    if (associationError || !associationData) {
      return json(404, { error: "Associação não encontrada." });
    }

    const association = associationData as AssociationRow;

    let connectedAccountId = association.stripe_connected_account_id;

    if (!connectedAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        company: {
          name: association.name,
          tax_id: onlyDigits(association.cnpj) || undefined,
        },
        metadata: {
          association_id: association.id,
          community: association.community,
          created_by: user.id,
        },
      });

      connectedAccountId = account.id;

      const { error: updateError } = await admin
        .from("association")
        .update({
          stripe_connected_account_id: connectedAccountId,
          stripe_onboarding_completed: false,
        })
        .eq("id", association.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    if (association.stripe_onboarding_completed) {
      const loginLink =
        await stripe.accounts.createLoginLink(connectedAccountId);

      return json(200, {
        url: loginLink.url,
        mode: "login",
      });
    }

    const normalizedBaseUrl = appBaseUrl.trim().replace(/\/$/, "");

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `${normalizedBaseUrl}/admin/association?stripe=refresh`,
      return_url: `${normalizedBaseUrl}/admin/association?stripe=return`,
      type: "account_onboarding",
    });

    return json(200, {
      url: accountLink.url,
      mode: "onboarding",
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao iniciar onboarding Stripe.",
    });
  }
});
