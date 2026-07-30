export type OAuthTokenResponse = {
  access_token: string;
  public_key: string;
  refresh_token: string;
  live_mode: boolean;
  user_id: number | string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type MercadoPagoFeeDetail = {
  type?: string;
  amount?: number;
  fee_payer?: string;
};

export type MercadoPagoPaymentResponse = {
  id: number | string;

  status: string;
  status_detail?: string | null;

  date_created?: string | null;
  date_last_updated?: string | null;
  date_approved?: string | null;
  date_of_expiration?: string | null;

  transaction_amount?: number;
  application_fee?: number | null;

  external_reference?: string | null;

  payer?: {
    id?: string | number;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;

    identification?: {
      type?: string | null;
      number?: string | null;
    };
  };

  point_of_interaction?: {
    type?: string;

    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    };
  };

  transaction_data?: {
    qr_code?: string | null;
    qr_code_base64?: string | null;
    ticket_url?: string | null;
  };

  transaction_details?: {
    net_received_amount?: number | null;
    total_paid_amount?: number | null;
    overpaid_amount?: number | null;
    installment_amount?: number | null;
  };

  fee_details?: MercadoPagoFeeDetail[];
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Env obrigatório não configurado: ${name}`);
  }

  return value;
}

export function getMercadoPagoConfig() {
  return {
    clientId: requiredEnv("MP_CLIENT_ID"),

    clientSecret: requiredEnv("MP_CLIENT_SECRET"),

    redirectUri: requiredEnv("MP_REDIRECT_URI"),

    redirectSponsorUri: requiredEnv("MP_REDIRECT_URI_SPONSOR_CONNECT"),

    webhookSecret: requiredEnv("MP_WEBHOOK_SECRET"),

    appBaseUrl: requiredEnv("APP_BASE_URL").replace(/\/$/, ""),

    pixExpirationMinutes: Number(
      Deno.env.get("MP_PIX_EXPIRATION_MINUTES") ?? "30",
    ),

    webhookUrl:
      Deno.env.get("MP_WEBHOOK_URL") ??
      `${requiredEnv("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
  };
}

export function buildMercadoPagoAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://auth.mercadopago.com.br/authorization");

  url.searchParams.set("client_id", params.clientId);

  url.searchParams.set("response_type", "code");

  url.searchParams.set("platform_id", "mp");

  url.searchParams.set("redirect_uri", params.redirectUri);

  url.searchParams.set("state", params.state);

  return url.toString();
}

export async function exchangeAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  state: string;
}) {
  const body = new URLSearchParams({
    client_id: params.clientId,

    client_secret: params.clientSecret,

    grant_type: "authorization_code",

    code: params.code,

    redirect_uri: params.redirectUri,

    state: params.state,
  });

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",

    headers: {
      accept: "application/json",

      "content-type": "application/x-www-form-urlencoded",
    },

    body,
  });

  const data = (await response.json().catch(() => null)) as
    | OAuthTokenResponse
    | Record<string, unknown>
    | null;

  if (!response.ok || !data) {
    throw new Error(
      `Falha ao trocar authorization code: ${JSON.stringify(data ?? {})}`,
    );
  }

  return data as OAuthTokenResponse;
}

export async function refreshAuthorization(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const body = new URLSearchParams({
    client_id: params.clientId,

    client_secret: params.clientSecret,

    grant_type: "refresh_token",

    refresh_token: params.refreshToken,
  });

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",

    headers: {
      accept: "application/json",

      "content-type": "application/x-www-form-urlencoded",
    },

    body,
  });

  const data = (await response.json().catch(() => null)) as
    | OAuthTokenResponse
    | Record<string, unknown>
    | null;

  if (!response.ok || !data) {
    throw new Error(
      `Falha ao renovar access token: ${JSON.stringify(data ?? {})}`,
    );
  }

  return data as OAuthTokenResponse;
}

export async function createPixPayment(params: {
  sellerAccessToken: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
}) {
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",

    headers: {
      accept: "application/json",

      "content-type": "application/json",

      Authorization: `Bearer ${params.sellerAccessToken}`,

      "X-Idempotency-Key": params.idempotencyKey,
    },

    body: JSON.stringify(params.body),
  });

  const data = (await response.json().catch(() => null)) as
    | MercadoPagoPaymentResponse
    | Record<string, unknown>
    | null;

  if (!response.ok || !data) {
    throw new Error(
      `Falha ao criar pagamento Pix: ${JSON.stringify(data ?? {})}`,
    );
  }

  return data as MercadoPagoPaymentResponse;
}

export async function fetchPayment(params: {
  sellerAccessToken: string;
  paymentId: string | number;
}) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${params.paymentId}`,
    {
      method: "GET",

      headers: {
        accept: "application/json",

        Authorization: `Bearer ${params.sellerAccessToken}`,
      },
    },
  );

  const data = (await response.json().catch(() => null)) as
    | MercadoPagoPaymentResponse
    | Record<string, unknown>
    | null;

  if (!response.ok || !data) {
    throw new Error(`Falha ao buscar pagamento: ${JSON.stringify(data ?? {})}`);
  }

  return data as MercadoPagoPaymentResponse;
}

export function sanitizeCpf(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function splitFullName(fullName: string | null | undefined) {
  const cleaned = String(fullName ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) {
    return {
      firstName: "Morador",

      lastName: "AMA",
    };
  }

  const [firstName, ...rest] = cleaned.split(" ");

  return {
    firstName,

    lastName: rest.join(" ") || "AMA",
  };
}

export function addMinutesIso(minutes: number) {
  const date = new Date();

  date.setMinutes(date.getMinutes() + minutes);

  return date.toISOString();
}

export function toMoneyNumberFromCents(cents: number) {
  return Number((cents / 100).toFixed(2));
}

export function normalizeInternalPaymentStatus(mpStatus: string) {
  switch (mpStatus) {
    case "approved":
      return "succeeded";

    case "pending":
    case "in_process":
    case "authorized":
      return "pending";

    case "cancelled":
      return "cancelled";

    case "rejected":
    case "refunded":
    case "charged_back":
      return "failed";

    default:
      return "pending";
  }
}

function parseSignatureHeader(value: string | null) {
  const result: Record<string, string> = {};

  for (const piece of String(value ?? "").split(",")) {
    const [rawKey, rawValue] = piece.split("=", 2);

    const key = rawKey?.trim();

    const val = rawValue?.trim();

    if (key && val) {
      result[key] = val;
    }
  }

  return result;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",

    new TextEncoder().encode(secret),

    {
      name: "HMAC",
      hash: "SHA-256",
    },

    false,

    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",

    key,

    new TextEncoder().encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyWebhookSignature(req: Request, secret: string) {
  const signature = parseSignatureHeader(req.headers.get("x-signature"));

  const ts = signature.ts;

  const v1 = signature.v1;

  const requestId = req.headers.get("x-request-id") ?? "";

  const url = new URL(req.url);

  const dataId = (url.searchParams.get("data.id") ?? "").toLowerCase();

  if (!ts || !v1 || !requestId || !dataId) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const calculated = await hmacSha256Hex(secret, manifest);

  return calculated === v1;
}
