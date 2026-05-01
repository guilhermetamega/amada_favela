export function normalizeAddressNumber(value?: string | null) {
  if (!value) return "";

  const trimmed = value.trim();

  if (!trimmed || trimmed === "0") {
    return "";
  }

  return trimmed;
}

export function buildAddressLine(
  address1?: string | null,
  addressNumber?: string | null,
) {
  const normalizedAddress1 = address1?.trim() ?? "";
  const normalizedNumber = normalizeAddressNumber(addressNumber);

  if (!normalizedAddress1) return "";
  if (!normalizedNumber) return normalizedAddress1;

  return `${normalizedAddress1} ${normalizedNumber}`;
}

export function buildFullAddressLine(
  address1?: string | null,
  addressNumber?: string | null,
  address2?: string | null,
) {
  const primary = buildAddressLine(address1, addressNumber);
  const complement = address2?.trim() ?? "";

  return [primary, complement].filter(Boolean).join(", ");
}
