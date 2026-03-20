import { COMMUNITIES } from "@/lib/communities";
import { getCommunityImageSignedUrl } from "@/services/supabase/community_data";
import { supabase } from "@/services/supabase/client";
import {
  getMyAvatarSignedUrl,
  getMyProfile,
} from "@/services/supabase/user_profile";
import { MemberCardData } from "@/types/member_card";

type PartnerRow = {
  expires_at: string;
};

type CommunityDataRow = {
  picture_path: string | null;
};

function calculateAge(birth: string | null) {
  if (!birth) return null;

  const today = new Date();
  const birthDate = new Date(birth);

  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age;
}

function buildFullAddress(
  address1: string | null | undefined,
  address2: string | null | undefined,
) {
  return [address1?.trim(), address2?.trim()].filter(Boolean).join(", ");
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
    .select("expires_at")
    .eq("user_id", profile.id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<PartnerRow>();

  if (partnerError) {
    throw new Error(partnerError.message);
  }

  const isPartnerActive =
    !!partner && new Date(partner.expires_at) >= new Date();

  if (!isPartnerActive) {
    throw new Error(
      "Você precisa ter uma assinatura de sócio ativa para acessar sua carteirinha.",
    );
  }

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
    address_2: profile.address_2,
    fullAddress:
      buildFullAddress(profile.address_1, profile.address_2) ||
      "Endereço não informado.",
    community: getCommunityLabel(profile.comunity),
    picturePath: profile.picture_path,
    avatarUrl,
    associationLogoUrl,
    issuedAt: new Date().toISOString(),
    expiresAt: partner.expires_at,
  };
}
