import { buildAddressLine } from "@/utils/address";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCpf(cpf: string) {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11) return cpf;

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function maskCnpj(cnpj: string) {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) return cnpj;

  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
}

export function maskZipcode(zipcode: string) {
  const digits = onlyDigits(zipcode);

  if (digits.length !== 8) return zipcode;

  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(date));
}

export function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export function buildAssociationAddress(input: {
  headquarters_address: string;
  headquarters_number: string | null;
  headquarters_complement: string | null;
  headquarters_neighborhood: string | null;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
}) {
  return [
    [input.headquarters_address, input.headquarters_number]
      .filter(Boolean)
      .join(", "),
    input.headquarters_complement || null,
    input.headquarters_neighborhood || null,
    `${input.headquarters_city} - ${input.headquarters_state}`,
    `CEP ${maskZipcode(input.headquarters_zipcode)}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildUserAddress(input: {
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  zipcode: string;
}) {
  return [
    buildAddressLine(input.address_1, input.address_number),
    input.address_2 || null,
    `CEP ${maskZipcode(input.zipcode)}`,
  ]
    .filter(Boolean)
    .join(", ");
}
