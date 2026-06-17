import { supabase } from "@/services/supabase/client";
import type { LoginFormData, RegisterFormData } from "@/types/auth";
import { LEGAL_POLICY_VERSION, LEGAL_TERMS_VERSION } from "@/lib/legal";

type EmailLookupRow = {
  email: string | null;
};

function normalizeAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "CPF/e-mail ou senha inválidos.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "Já existe uma conta cadastrada com este e-mail.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  return message;
}

function sanitizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

function isEmail(value: string) {
  return value.includes("@");
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

function getFileExtension(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();

  if (
    fileNameExtension &&
    ["jpg", "jpeg", "png", "webp"].includes(fileNameExtension)
  ) {
    return fileNameExtension;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function validateProfilePicture(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeInBytes = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Envie uma imagem JPG, PNG ou WEBP.");
  }

  if (file.size > maxSizeInBytes) {
    throw new Error("A foto deve ter no máximo 5 MB.");
  }
}

async function uploadProfilePicture(userId: string, file: File) {
  validateProfilePicture(file);

  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${userId}/${Date.now()}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("profile_pic")
    .upload(filePath, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error("Erro ao enviar foto de perfil.");
  }

  return filePath;
}

async function getEmailByCpf(cpf: string) {
  const sanitizedCpf = sanitizeCpf(cpf);

  if (!sanitizedCpf) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_email_by_cpf", {
    input_cpf: sanitizedCpf,
  });

  if (error) {
    throw new Error("Erro ao buscar usuário para login.");
  }

  const result = data as EmailLookupRow[] | null;
  return result?.[0]?.email ?? null;
}

async function cpfAlreadyExists(cpf: string) {
  const sanitizedCpf = sanitizeCpf(cpf);

  if (!sanitizedCpf) {
    return false;
  }

  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("cpf", sanitizedCpf)
    .limit(1)
    .maybeSingle<EmailLookupRow>();

  if (error) {
    throw new Error("Erro ao validar CPF já cadastrado.");
  }

  return !!data?.email;
}

export async function signInWithIdentifier({
  identifier,
  password,
}: LoginFormData) {
  const rawIdentifier = identifier.trim();

  if (!rawIdentifier) {
    throw new Error("Informe seu CPF ou e-mail.");
  }

  let email = rawIdentifier.toLowerCase();

  if (!isEmail(rawIdentifier)) {
    const foundEmail = await getEmailByCpf(rawIdentifier);

    if (!foundEmail) {
      throw new Error("CPF/e-mail ou senha inválidos.");
    }

    email = foundEmail;
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    throw new Error(normalizeAuthErrorMessage(authError.message));
  }

  return authData;
}

export async function sendPasswordRecoveryEmail(identifier: string) {
  const rawIdentifier = identifier.trim();

  if (!rawIdentifier) {
    throw new Error("Informe seu CPF ou e-mail para recuperar a senha.");
  }

  let email = rawIdentifier.toLowerCase();

  if (!isEmail(rawIdentifier)) {
    const foundEmail = await getEmailByCpf(rawIdentifier);

    if (!foundEmail) {
      throw new Error("Não encontramos uma conta com este CPF/e-mail.");
    }

    email = foundEmail;
  }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error.message));
  }
}

export async function updateRecoveredPassword(newPassword: string) {
  const sanitizedPassword = newPassword.trim();

  if (sanitizedPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }

  const { error } = await supabase.auth.updateUser({
    password: sanitizedPassword,
  });

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error.message));
  }
}

export async function signUpWithEmail(
  data: RegisterFormData,
  profilePictureFile?: File | null,
) {
  const {
    fullname,
    cpf,
    birth,
    address_1,
    address_number,
    address_2,
    zipcode,
    comunity,
    email,
    phone,
    password,
  } = data;

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedFullname = fullname.trim();
  const sanitizedCpf = sanitizeCpf(cpf);
  const sanitizedBirth = birth;
  const sanitizedAddress1 = address_1.trim();
  const sanitizedAddressNumber = address_number.trim();
  const sanitizedAddress2 = address_2.trim();
  const sanitizedZipcode = zipcode.trim();
  const sanitizedComunity = comunity.trim();
  const sanitizedPhone = phone.trim();

  if (!sanitizedFullname) {
    throw new Error("Informe seu nome.");
  }

  if (!sanitizedEmail) {
    throw new Error("Informe seu e-mail.");
  }

  if (sanitizedCpf) {
    const alreadyExists = await cpfAlreadyExists(sanitizedCpf);

    if (alreadyExists) {
      throw new Error("Este CPF já está cadastrado.");
    }
  }

  const nowIso = new Date().toISOString();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
    options: {
      data: {
        fullname: sanitizedFullname,
        cpf: sanitizedCpf || null,

        accepted_terms: true,
        accepted_privacy_policy: true,
        accepted_terms_version: LEGAL_TERMS_VERSION,
        accepted_privacy_version: LEGAL_POLICY_VERSION,
        accepted_legal_at: nowIso,
      },
    },
  });

  if (authError) {
    throw new Error(normalizeAuthErrorMessage(authError.message));
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Não foi possível obter o ID do usuário após o cadastro.");
  }

  let picturePath: string | null = null;

  try {
    if (profilePictureFile) {
      picturePath = await uploadProfilePicture(userId, profilePictureFile);
    }

    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      fullname: sanitizedFullname,
      cpf: sanitizedCpf || null,
      birth: sanitizedBirth,
      address_1: sanitizedAddress1,
      address_number: sanitizedAddressNumber || null,
      address_2: sanitizedAddress2 || null,
      zipcode: sanitizedZipcode || null,
      comunity: sanitizedComunity || null,
      email: sanitizedEmail,
      phone: sanitizedPhone || null,
      picture_path: picturePath,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      ...authData,
      picture_path: picturePath,
    };
  } catch (error) {
    await supabase.auth.signOut();
    throw error instanceof Error
      ? error
      : new Error("Erro ao concluir cadastro.");
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error.message));
  }
}
