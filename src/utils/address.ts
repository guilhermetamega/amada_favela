export function buildAddressLine(
  address1: string | null | undefined,
  addressNumber: string | null | undefined,
) {
  const street = address1?.trim() ?? "";
  const number = addressNumber?.trim() ?? "";

  if (!street) return "";
  if (!number) return street;

  const numberAtEndPattern = new RegExp(`(?:,|\\s)${number}$`);
  if (numberAtEndPattern.test(street)) {
    return street;
  }

  return `${street}, ${number}`;
}

export function buildFullAddress(input: {
  address1: string | null | undefined;
  addressNumber?: string | null | undefined;
  address2?: string | null | undefined;
  zipcode?: string | null | undefined;
}) {
  const line1 = buildAddressLine(input.address1, input.addressNumber);
  const line2 = input.address2?.trim() ?? "";
  const zipcode = input.zipcode?.trim() ?? "";

  return [line1, line2, zipcode ? `CEP ${zipcode}` : ""]
    .filter(Boolean)
    .join(", ");
}
