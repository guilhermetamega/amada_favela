function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hash);
}

export async function generateValidationCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const randomSeed = `${crypto.randomUUID()}|${Date.now()}|${Math.random()}`;
  const hash = await sha256(randomSeed);

  return `RP-${yyyy}${mm}${dd}-${hash.slice(0, 10).toUpperCase()}`;
}

export async function buildResidenceProofHash(input: {
  userId: string;
  associationId: string;
  cpf: string;
  address: string;
  issuedAt: string;
  expiresAt: string;
  validationCode: string;
}) {
  return sha256(
    [
      input.userId,
      input.associationId,
      input.cpf,
      input.address,
      input.issuedAt,
      input.expiresAt,
      input.validationCode,
    ].join("|"),
  );
}
