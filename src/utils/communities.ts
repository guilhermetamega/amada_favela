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
