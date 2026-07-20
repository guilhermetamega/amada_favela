import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const LOG_PREFIX = "[admin-update-user]";

type UserRole = "admin" | "president" | "employee" | "user";

type UpdateMode = "basic" | "sensitive";

type VerificationMethod =
  | "document_with_photo"
  | "existing_registration_confirmation"
  | "in_person_confirmation";

type RequestBody = {
  targetUserId?: unknown;
  mode?: unknown;
  data?: unknown;
  verificationMethod?: unknown;
  reason?: unknown;
};

type ActorRow = {
  id: string;
  role: UserRole;
  comunity: string | null;
};

type TargetRow = {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  cpf: string | null;
  birth: string;
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  zipcode: string;
  comunity: string;
  role: UserRole;
};

type DetailPermissionPayload = {
  permissions?: {
    can_edit_basic_data?: boolean;
    can_edit_sensitive_data?: boolean;
  };
};

type Changes = Record<string, string | null>;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function log(step: string, payload?: unknown) {
  console.log(`${LOG_PREFIX} ${step}`, payload ?? "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(value: unknown, fieldLabel: string) {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldLabel} é obrigatório.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new HttpError(400, `${fieldLabel} é obrigatório.`);
  }

  return normalized;
}

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeComparableText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  function calculateDigit(length: number) {
    let sum = 0;

    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }

    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  }

  return (
    calculateDigit(9) === Number(cpf[9]) &&
    calculateDigit(10) === Number(cpf[10])
  );
}

function isValidBirth(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) {
    return false;
  }

  const minimumDate = new Date();
  minimumDate.setFullYear(minimumDate.getFullYear() - 120);

  return date >= minimumDate;
}

function maskEmail(value: string) {
  const [localPart, domain] = value.split("@");

  if (!localPart || !domain) {
    return "••••";
  }

  return `${localPart.slice(0, 1)}•••@${domain}`;
}

function maskCpf(value: string) {
  const digits = onlyDigits(value);

  return digits.length === 11 ? `***.***.***-${digits.slice(-2)}` : "••••";
}

function maskPhone(value: string) {
  const digits = onlyDigits(value);

  return digits.length >= 4 ? `•••• •••• ${digits.slice(-4)}` : "••••";
}

function buildSummary(
  field: string,
  before: string | null,
  after: string | null,
) {
  if (field === "email") {
    return {
      before: maskEmail(before ?? ""),
      after: maskEmail(after ?? ""),
    };
  }

  if (field === "cpf") {
    return {
      before: maskCpf(before ?? ""),
      after: maskCpf(after ?? ""),
    };
  }

  if (field === "phone") {
    return {
      before: maskPhone(before ?? ""),
      after: maskPhone(after ?? ""),
    };
  }

  if (field === "role" || field === "comunity") {
    return {
      before,
      after,
    };
  }

  return {
    changed: true,
  };
}

function getActionType(mode: UpdateMode, changedFields: string[]) {
  if (changedFields.length === 1 && changedFields[0] === "email") {
    return "user_email_updated";
  }

  if (changedFields.length === 1 && changedFields[0] === "cpf") {
    return "user_cpf_updated";
  }

  if (changedFields.length === 1 && changedFields[0] === "role") {
    return "user_role_updated";
  }

  if (changedFields.length === 1 && changedFields[0] === "comunity") {
    return "user_community_updated";
  }

  return mode === "basic"
    ? "user_basic_data_updated"
    : "user_sensitive_data_updated";
}

function normalizeBasicChanges(
  data: Record<string, unknown>,
  target: TargetRow,
) {
  const fullname = getRequiredString(data.fullname, "Nome completo").replace(
    /\s+/g,
    " ",
  );

  if (fullname.length < 3 || fullname.length > 150) {
    throw new HttpError(400, "O nome deve possuir entre 3 e 150 caracteres.");
  }

  const phone = onlyDigits(getRequiredString(data.phone, "Telefone"));

  if (phone.length !== 10 && phone.length !== 11) {
    throw new HttpError(400, "Informe um telefone com DDD.");
  }

  const address1 = getRequiredString(data.address1, "Rua");

  if (address1.length > 180) {
    throw new HttpError(400, "O nome da rua é muito longo.");
  }

  const addressNumber = getRequiredString(data.addressNumber, "Número");

  if (addressNumber.length > 30) {
    throw new HttpError(400, "O número do endereço é muito longo.");
  }

  const address2 =
    typeof data.address2 === "string" ? data.address2.trim() : "";

  if (address2.length > 180) {
    throw new HttpError(400, "O complemento é muito longo.");
  }

  const zipcode = onlyDigits(getRequiredString(data.zipcode, "CEP"));

  if (zipcode.length !== 8) {
    throw new HttpError(400, "O CEP deve possuir 8 dígitos.");
  }

  const changes: Changes = {};

  if (
    normalizeComparableText(fullname) !==
    normalizeComparableText(target.fullname)
  ) {
    changes.fullname = fullname;
  }

  if (phone !== onlyDigits(target.phone)) {
    changes.phone = phone;
  }

  if (
    normalizeComparableText(address1) !==
    normalizeComparableText(target.address_1)
  ) {
    changes.address_1 = address1;
  }

  if (
    normalizeComparableText(addressNumber) !==
    normalizeComparableText(target.address_number)
  ) {
    changes.address_number = addressNumber;
  }

  if (
    normalizeComparableText(address2) !==
    normalizeComparableText(target.address_2)
  ) {
    changes.address_2 = address2 || null;
  }

  if (zipcode !== onlyDigits(target.zipcode)) {
    changes.zipcode = zipcode;
  }

  return changes;
}

function normalizeSensitiveChanges(
  data: Record<string, unknown>,
  actor: ActorRow,
  target: TargetRow,
) {
  if (actor.role === "employee") {
    throw new HttpError(403, "Funcionários não podem alterar dados sensíveis.");
  }

  const email = normalizeEmail(getRequiredString(data.email, "E-mail"));

  if (!isValidEmail(email)) {
    throw new HttpError(400, "Informe um e-mail válido.");
  }

  const birth = getRequiredString(data.birth, "Data de nascimento");

  if (!isValidBirth(birth)) {
    throw new HttpError(400, "Informe uma data de nascimento válida.");
  }

  const role = getRequiredString(data.role, "Função") as UserRole;

  const community = getRequiredString(
    data.community,
    "Comunidade",
  ).toLowerCase();

  const changes: Changes = {};

  if (email !== normalizeEmail(target.email)) {
    changes.email = email;
  }

  if (typeof data.cpf === "string" && data.cpf.trim()) {
    const cpf = onlyDigits(data.cpf);

    if (!isValidCpf(cpf)) {
      throw new HttpError(400, "Informe um CPF válido.");
    }

    if (cpf !== onlyDigits(target.cpf)) {
      changes.cpf = cpf;
    }
  }

  if (birth !== target.birth) {
    changes.birth = birth;
  }

  if (actor.role === "president") {
    if (role !== "user" && role !== "employee") {
      throw new HttpError(
        403,
        "O presidente só pode definir usuário ou funcionário.",
      );
    }

    if (community !== actor.comunity) {
      throw new HttpError(403, "O presidente não pode alterar a comunidade.");
    }
  }

  if (actor.role === "admin") {
    if (role !== "user" && role !== "employee" && role !== "president") {
      throw new HttpError(400, "Função administrativa inválida.");
    }
  }

  if (role !== target.role) {
    changes.role = role;
  }

  if (community !== target.comunity) {
    changes.comunity = community;
  }

  return changes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(405, {
      error: "Método não permitido.",
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new HttpError(401, "Usuário não autenticado.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Variáveis obrigatórias do servidor não configuradas.");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      throw new HttpError(401, "Sessão inválida ou expirada.");
    }

    const body = (await req.json()) as RequestBody;

    const targetUserId = getRequiredString(body.targetUserId, "Usuário");

    const mode = getRequiredString(
      body.mode,
      "Tipo de alteração",
    ) as UpdateMode;

    if (mode !== "basic" && mode !== "sensitive") {
      throw new HttpError(400, "Tipo de alteração inválido.");
    }

    if (!isRecord(body.data)) {
      throw new HttpError(400, "Dados de alteração inválidos.");
    }

    const verificationMethod = getRequiredString(
      body.verificationMethod,
      "Método de verificação",
    ) as VerificationMethod;

    if (
      ![
        "document_with_photo",
        "existing_registration_confirmation",
        "in_person_confirmation",
      ].includes(verificationMethod)
    ) {
      throw new HttpError(400, "Método de verificação inválido.");
    }

    const reason = getRequiredString(body.reason, "Justificativa");

    if (reason.length < 10) {
      throw new HttpError(
        400,
        "A justificativa deve possuir pelo menos 10 caracteres.",
      );
    }

    if (reason.length > 500) {
      throw new HttpError(
        400,
        "A justificativa deve possuir no máximo 500 caracteres.",
      );
    }

    if (targetUserId === authUser.id) {
      throw new HttpError(
        403,
        "Use o perfil pessoal para alterar os próprios dados.",
      );
    }

    const [actorResponse, targetResponse, permissionResponse] =
      await Promise.all([
        admin
          .from("users")
          .select("id, role, comunity")
          .eq("id", authUser.id)
          .single(),

        admin
          .from("users")
          .select(
            [
              "id",
              "fullname",
              "email",
              "phone",
              "cpf",
              "birth",
              "address_1",
              "address_number",
              "address_2",
              "zipcode",
              "comunity",
              "role",
            ].join(","),
          )
          .eq("id", targetUserId)
          .single(),

        userClient.rpc("admin_get_user_detail", {
          p_user_id: targetUserId,
        }),
      ]);

    if (actorResponse.error || !actorResponse.data) {
      throw new HttpError(404, "Perfil do operador não encontrado.");
    }

    if (targetResponse.error || !targetResponse.data) {
      throw new HttpError(404, "Usuário não encontrado.");
    }

    if (permissionResponse.error || !permissionResponse.data) {
      throw new HttpError(
        403,
        permissionResponse.error?.message ||
          "Você não possui acesso a este usuário.",
      );
    }

    const actor = actorResponse.data as ActorRow;

    const target = targetResponse.data as TargetRow;

    const permissionPayload =
      permissionResponse.data as DetailPermissionPayload;

    if (target.role === "admin") {
      throw new HttpError(
        403,
        "Administradores não podem ser alterados por este fluxo.",
      );
    }

    if (
      mode === "basic" &&
      !permissionPayload.permissions?.can_edit_basic_data
    ) {
      throw new HttpError(
        403,
        "Você não possui permissão para editar dados básicos.",
      );
    }

    if (
      mode === "sensitive" &&
      !permissionPayload.permissions?.can_edit_sensitive_data
    ) {
      throw new HttpError(
        403,
        "Você não possui permissão para editar dados sensíveis.",
      );
    }

    const changes =
      mode === "basic"
        ? normalizeBasicChanges(body.data, target)
        : normalizeSensitiveChanges(body.data, actor, target);

    const changedFields = Object.keys(changes);

    if (changedFields.length === 0) {
      throw new HttpError(400, "Nenhum dado foi alterado.");
    }

    if (changes.comunity) {
      const { data: community, error: communityError } = await admin
        .from("communities")
        .select("key")
        .eq("key", changes.comunity)
        .eq("active", true)
        .maybeSingle();

      if (communityError || !community) {
        throw new HttpError(
          400,
          "A comunidade informada não existe ou está inativa.",
        );
      }
    }

    if (changes.email) {
      const { data: emailOwner, error: emailOwnerError } = await admin
        .from("users")
        .select("id")
        .ilike("email", changes.email)
        .neq("id", targetUserId)
        .maybeSingle();

      if (emailOwnerError) {
        throw new Error(emailOwnerError.message);
      }

      if (emailOwner) {
        throw new HttpError(
          409,
          "Este e-mail já está vinculado a outra conta.",
        );
      }
    }

    if (changes.cpf) {
      const { data: cpfOwner, error: cpfOwnerError } = await admin
        .from("users")
        .select("id")
        .eq("cpf", changes.cpf)
        .neq("id", targetUserId)
        .maybeSingle();

      if (cpfOwnerError) {
        throw new Error(cpfOwnerError.message);
      }

      if (cpfOwner) {
        throw new HttpError(409, "Este CPF já está vinculado a outra conta.");
      }
    }

    const changeSummary: Record<string, unknown> = {};

    for (const field of changedFields) {
      const sourceField =
        field === "address_1"
          ? "address_1"
          : field === "address_number"
            ? "address_number"
            : field === "address_2"
              ? "address_2"
              : field;

      const beforeValue =
        String(target[sourceField as keyof TargetRow] ?? "") || null;

      const afterValue =
        changes[field] === null ? null : String(changes[field]);

      changeSummary[field] = buildSummary(field, beforeValue, afterValue);
    }

    const actionType = getActionType(mode, changedFields);

    let previousAuthEmail: string | null = null;

    let authEmailWasChanged = false;

    if (changes.email) {
      const { data: authTarget, error: authTargetError } =
        await admin.auth.admin.getUserById(targetUserId);

      if (authTargetError || !authTarget.user) {
        throw new HttpError(404, "Conta de autenticação não encontrada.");
      }

      previousAuthEmail = authTarget.user.email ?? null;

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(
        targetUserId,
        {
          email: changes.email,
          email_confirm: true,
        },
      );

      if (authUpdateError) {
        throw new HttpError(409, authUpdateError.message);
      }

      authEmailWasChanged = true;
    }

    const { data: updateResult, error: updateError } = await admin.rpc(
      "admin_apply_user_update",
      {
        p_actor_user_id: authUser.id,
        p_target_user_id: targetUserId,
        p_changes: changes,
        p_action_type: actionType,
        p_changed_fields: changedFields,
        p_change_summary: changeSummary,
        p_verification_method: verificationMethod,
        p_reason: reason,
      },
    );

    if (updateError) {
      if (authEmailWasChanged && previousAuthEmail) {
        const { error: rollbackError } = await admin.auth.admin.updateUserById(
          targetUserId,
          {
            email: previousAuthEmail,
            email_confirm: true,
          },
        );

        if (rollbackError) {
          log("auth-email:rollback-failed", {
            targetUserId,
            message: rollbackError.message,
          });
        }
      }

      throw new HttpError(400, updateError.message);
    }

    log("user:updated", {
      actorUserId: authUser.id,
      targetUserId,
      changedFields,
    });

    return json(200, {
      success: true,
      message: "Dados atualizados com sucesso.",
      updated: updateResult,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao atualizar usuário.";

    log("fatal", {
      status,
      message,
    });

    return json(status, {
      error: message,
    });
  }
});
