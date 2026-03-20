import { COMMUNITIES } from "@/lib/communities";

export function getCommunityOptions() {
  return COMMUNITIES.map((community) => ({
    value: community.key,
    label: community.label,
  }));
}

export function getCommunityByKey(key: string) {
  return COMMUNITIES.find((community) => community.key === key) ?? null;
}

export function getCommunityAddressItems(key: string) {
  const community = getCommunityByKey(key);
  return community?.addressItems ?? [];
}

export function getCommunityZipcodes(key: string) {
  const community = getCommunityByKey(key);
  return community?.zipcodes ?? [];
}

function normalizeCommunityKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getCommunityLabelByKey(
  communityKey: string | null | undefined,
): string {
  const normalizedKey = normalizeCommunityKey(communityKey);

  if (!normalizedKey) {
    return "Comunidade";
  }

  const match = COMMUNITIES.find(
    (item) => normalizeCommunityKey(item.key) === normalizedKey,
  );

  return match?.label ?? communityKey?.trim() ?? "Comunidade";
}

export function getAssociationDisplayName(
  communityKey: string | null | undefined,
): string {
  return getCommunityLabelByKey(communityKey);
}
