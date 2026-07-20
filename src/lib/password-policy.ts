export type PasswordIdentityContext = {
  fullname?: string | null;
  cpf?: string | null;
  phone?: string | null;
};

export type PasswordRequirementState = {
  hasMinimumLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasNoOuterSpaces: boolean;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function getPasswordRequirementState(
  password: string,
): PasswordRequirementState {
  return {
    hasMinimumLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasNoOuterSpaces: password === password.trim(),
  };
}

export function isBasePasswordPolicyValid(password: string) {
  const requirements = getPasswordRequirementState(password);

  return Object.values(requirements).every(Boolean);
}

export function validatePasswordPolicy(
  password: string,
  identity: PasswordIdentityContext,
) {
  const requirements = getPasswordRequirementState(password);

  if (!requirements.hasMinimumLength) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (!requirements.hasUppercase) {
    throw new Error("Inclua pelo menos uma letra maiúscula.");
  }

  if (!requirements.hasLowercase) {
    throw new Error("Inclua pelo menos uma letra minúscula.");
  }

  if (!requirements.hasNumber) {
    throw new Error("Inclua pelo menos um número.");
  }

  if (!requirements.hasNoOuterSpaces) {
    throw new Error("A senha não pode começar ou terminar com espaços.");
  }

  const passwordDigits = onlyDigits(password);
  const normalizedPassword = normalizeText(password);

  const cpf = onlyDigits(identity.cpf);

  if (cpf.length === 11 && passwordDigits.includes(cpf)) {
    throw new Error("A senha não pode conter seu CPF.");
  }

  const phone = onlyDigits(identity.phone);
  const phoneReference = phone.length >= 8 ? phone.slice(-8) : phone;

  if (phoneReference.length >= 8 && passwordDigits.includes(phoneReference)) {
    throw new Error("A senha não pode conter seu número de telefone.");
  }

  const nameParts = normalizeText(identity.fullname ?? "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);

  const containsNamePart = nameParts.some((namePart) =>
    normalizedPassword.includes(namePart),
  );

  if (containsNamePart) {
    throw new Error("A senha não pode conter partes evidentes do seu nome.");
  }
}
