export const DEFAULT_PLATFORM_FEE_CENTS = 500;
export const THIRD_PARTY_TRANSFER_CENTS = 100;

export function normalizePlatformFeeCents(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Taxa da plataforma inválida.");
  }

  return parsed;
}

export function buildPlatformSplit(params: {
  platformFeeCents: unknown;
  hasThirdParty: boolean;
}) {
  const platformFeeCents = normalizePlatformFeeCents(params.platformFeeCents);

  /*
   * Em valores ímpares, a plataforma retém um centavo a mais.
   * A soma sempre permanece exatamente igual à taxa configurada.
   */
  const platformRetainedCents = Math.ceil(platformFeeCents / 2);

  const platformTransferCents = platformFeeCents - platformRetainedCents;

  const thirdPartyTransferCents = params.hasThirdParty
    ? THIRD_PARTY_TRANSFER_CENTS
    : 0;

  return {
    platformFeeCents,
    platformRetainedCents,
    platformTransferCents,
    thirdPartyTransferCents,
  };
}

export function getMinimumGrossCents(params: {
  platformFeeCents: unknown;
  hasThirdParty: boolean;
}) {
  const split = buildPlatformSplit(params);

  /*
   * Exige que reste pelo menos R$ 1,00 antes da tarifa do gateway.
   */
  return split.platformFeeCents + split.thirdPartyTransferCents + 100;
}
