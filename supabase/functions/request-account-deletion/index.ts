import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type RequestBody = {
  cpf?: string;
  birthDate?: string;
  confirmation?: string;
};

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = sanitizeDigits(value);

  if (digits.length !== 11) return value;

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function isValidCpf(value: string) {
  const cpf = sanitizeDigits(value);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cpf[10]);
}

function isValidBirthDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [dayStr, monthStr, yearStr] = value.split("/");
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (!day || !month || !year) return false;
  if (year < 1900) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const now = new Date();
  if (date > now) return false;

  return true;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as RequestBody;

    const rawCpf = (body.cpf ?? "").trim();
    const rawBirthDate = (body.birthDate ?? "").trim();
    const rawConfirmation = (body.confirmation ?? "").trim();

    const cpfDigits = sanitizeDigits(rawCpf);
    const formattedCpf = formatCpf(cpfDigits);
    const confirmation = rawConfirmation.toUpperCase();

    if (!cpfDigits) {
      return new Response(JSON.stringify({ error: "Informe o CPF." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!isValidCpf(cpfDigits)) {
      return new Response(JSON.stringify({ error: "CPF inválido." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!rawBirthDate) {
      return new Response(
        JSON.stringify({ error: "Informe a data de nascimento." }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!isValidBirthDate(rawBirthDate)) {
      return new Response(
        JSON.stringify({ error: "Data de nascimento inválida." }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (confirmation !== "CONFIRMAR") {
      return new Response(
        JSON.stringify({
          error: 'Digite exatamente "CONFIRMAR" para continuar.',
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL não configurada.");
    }

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
    }

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: insertError } = await supabase
      .from("account_deletion_requests")
      .insert({
        cpf: formattedCpf,
        birth_date: rawBirthDate,
        confirmation_text: "CONFIRMAR",
        status: "pending",
      });

    if (insertError) {
      throw new Error(`Erro ao registrar solicitação: ${insertError.message}`);
    }

    const requestedAt = new Date().toISOString();

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 16px;">Nova solicitação de exclusão de conta</h2>

        <p>
          Foi registrada uma nova solicitação manual de exclusão de conta na plataforma.
        </p>

        <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 16px 0;">
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>CPF</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(formattedCpf)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Data de nascimento</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(rawBirthDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Confirmação digitada</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">CONFIRMAR</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Status inicial</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">pending</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Solicitado em</strong></td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(requestedAt)}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 20px;">
          <strong>Atenção:</strong> esta solicitação informa que a conta e
          <strong> todo o conteúdo criado ou relacionado a ela</strong>
          deverão ser excluídos manualmente em até <strong>7 dias</strong>,
          salvo retenção estritamente necessária por obrigação legal.
        </p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `AMA da Favela <${resendFromEmail}>`,
        to: ["guitamega06@gmail.com"],
        subject: "Nova solicitação de exclusão de conta",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(`Erro ao enviar email: ${resendError}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Solicitação recebida. A exclusão da conta e de todo o conteúdo relacionado será analisada e concluída manualmente em até 7 dias.",
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao processar a solicitação.";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
