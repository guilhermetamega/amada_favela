import { supabase } from "@/services/supabase/client";
import type { LoginFormData, RegisterFormData } from "@/types/auth";

type GetEmailByCpfRow = {
  email: string;
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
  const filePath = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("profile_pic")
    .upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error("Erro ao enviar foto de perfil.");
  }

  const { data: publicUrlData } = supabase.storage
    .from("profile_pic")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
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

  const result = data as GetEmailByCpfRow[] | null;
  return result?.[0]?.email ?? null;
}

export async function signInWithIdentifier({
  identifier,
  password,
}: LoginFormData) {
  const rawIdentifier = identifier.trim();

  if (!rawIdentifier) {
    throw new Error("Informe seu CPF ou e-mail.");
  }

  let email = rawIdentifier.trim().toLowerCase();

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

export async function signUpWithEmail(
  data: RegisterFormData,
  profilePictureFile?: File | null,
) {
  const {
    fullname,
    cpf,
    birth,
    address_1,
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
    const { data: existingCpfData, error: existingCpfError } =
      await supabase.rpc("get_email_by_cpf", {
        input_cpf: sanitizedCpf,
      });

    if (existingCpfError) {
      throw new Error("Erro ao validar CPF já cadastrado.");
    }

    const existingCpfResult = existingCpfData as GetEmailByCpfRow[] | null;

    if (existingCpfResult?.[0]?.email) {
      throw new Error("Este CPF já está cadastrado.");
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
    options: {
      data: {
        fullname: sanitizedFullname,
        cpf: sanitizedCpf || null,
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

  let pictureUrl: string | null = null;

  try {
    if (profilePictureFile) {
      pictureUrl = await uploadProfilePicture(userId, profilePictureFile);
    }

    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      fullname: sanitizedFullname,
      cpf: sanitizedCpf || null,
      birth: sanitizedBirth,
      address_1: sanitizedAddress1,
      address_2: sanitizedAddress2 || null,
      zipcode: sanitizedZipcode || null,
      comunity: sanitizedComunity || null,
      email: sanitizedEmail,
      phone: sanitizedPhone || null,
      picture_url: pictureUrl,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      ...authData,
      picture_url: pictureUrl,
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
