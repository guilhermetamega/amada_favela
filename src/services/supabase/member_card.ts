import { COMMUNITIES } from "@/lib/communities";
import { getCommunityImageSignedUrl } from "@/services/supabase/community_data";
import { supabase } from "@/services/supabase/client";
import {
  getMyAvatarSignedUrl,
  getMyProfile,
} from "@/services/supabase/user_profile";
import { MemberCardData } from "@/types/member_card";
import { buildFullAddressLine } from "@/utils/address";

type PartnerRow = {
  expires_at: string;
  status: string | null;
};

type CommunityDataRow = {
  picture_path: string | null;
};

function calculateAge(birth: string | null) {
  if (!birth) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  const birthYear = dateOnly ? Number(dateOnly[1]) : new Date(birth).getFullYear();
  const birthMonth = dateOnly ? Number(dateOnly[2]) - 1 : new Date(birth).getMonth();
  const birthDay = dateOnly ? Number(dateOnly[3]) : new Date(birth).getDate();

  if (![birthYear, birthMonth, birthDay].every(Number.isFinite)) return null;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const monthDifference = today.getMonth() - birthMonth;
  const dayDifference = today.getDate() - birthDay;

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age;
}

function getCommunityLabel(comunity: string | null | undefined) {
  if (!comunity) return "Não informada";

  const community = COMMUNITIES.find((item) => item.key === comunity);

  return community?.label ?? comunity;
}

async function getAssociationLogoUrl(comunity: string | null | undefined) {
  if (!comunity) return null;

  const { data, error } = await supabase
    .from("community_data")
    .select("picture_path")
    .eq("community", comunity)
    .maybeSingle<CommunityDataRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.picture_path) {
    return null;
  }

  try {
    return await getCommunityImageSignedUrl(data.picture_path);
  } catch {
    return null;
  }
}

export async function getMyMemberCardData(): Promise<MemberCardData> {
  const profile = await getMyProfile();

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("expires_at, status")
    .eq("user_id", profile.id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<PartnerRow>();

  if (partnerError) {
    throw new Error(partnerError.message);
  }

  const isPartnerActive =
    !!partner &&
    !["expired", "cancelled", "past_due"].includes(partner.status ?? "") &&
    new Date(partner.expires_at).getTime() >= Date.now();

  const [avatarUrl, associationLogoUrl] = await Promise.all([
    getMyAvatarSignedUrl(profile.picture_path),
    getAssociationLogoUrl(profile.comunity),
  ]);

  return {
    userId: profile.id,
    fullname: profile.fullname,
    birth: profile.birth,
    age: calculateAge(profile.birth),
    address_1: profile.address_1,
    address_number: profile.address_number,
    address_2: profile.address_2,
    fullAddress:
      buildFullAddressLine(
        profile.address_1,
        profile.address_number,
        profile.address_2,
      ) || "Endereço não informado.",
    community: getCommunityLabel(profile.comunity),
    picturePath: profile.picture_path,
    avatarUrl,
    associationLogoUrl,
    issuedAt: new Date().toISOString(),
    expiresAt: partner?.expires_at ?? null,
    isPartnerActive,
  };
}
