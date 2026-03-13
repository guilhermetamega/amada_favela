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
    return "CPF ou senha inválidos.";
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

export async function signInWithCpf({ cpf, password }: LoginFormData) {
  const sanitizedCpf = sanitizeCpf(cpf);

  const { data, error: lookupError } = await supabase.rpc("get_email_by_cpf", {
    input_cpf: sanitizedCpf,
  });

  if (lookupError) {
    throw new Error("Erro ao buscar usuário para login.");
  }

  const result = data as GetEmailByCpfRow[] | null;
  const email = result?.[0]?.email;

  if (!email) {
    throw new Error("CPF ou senha inválidos.");
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

export async function signUpWithEmail(data: RegisterFormData) {
  const {
    fullname,
    cpf,
    birth,
    address_1,
    address_2,
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
  const sanitizedComunity = comunity.trim();
  const sanitizedPhone = phone.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
  });

  if (authError) {
    throw new Error(normalizeAuthErrorMessage(authError.message));
  }

  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("Não foi possível obter o ID do usuário após o cadastro.");
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: userId,
    fullname: sanitizedFullname,
    cpf: sanitizedCpf,
    birth: sanitizedBirth,
    address_1: sanitizedAddress1,
    address_2: sanitizedAddress2 || null,
    comunity: sanitizedComunity || null,
    email: sanitizedEmail,
    phone: sanitizedPhone || null,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return authData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error.message));
  }
}
