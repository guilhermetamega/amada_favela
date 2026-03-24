import {
  getMyAvatarSignedUrl,
  getMyListings,
  getMyPartnerHistory,
  getMyProfile,
} from "@/services/supabase/user_profile";
import { getProfileCache, saveProfileCache } from "@/lib/cache/profile-cache";

export async function prefetchProfilePage() {
  const cached = getProfileCache();
  if (cached) return;

  try {
    const [profile, partnerHistory, listings] = await Promise.all([
      getMyProfile(),
      getMyPartnerHistory(),
      getMyListings(),
    ]);

    let avatarUrl: string | null = null;

    if (profile.picture_path) {
      try {
        avatarUrl = await getMyAvatarSignedUrl(profile.picture_path);

        if (avatarUrl) {
          const img = new Image();
          img.src = avatarUrl;
        }
      } catch {
        avatarUrl = null;
      }
    }

    saveProfileCache({
      profile,
      partnerHistory,
      listings,
      avatarUrl,
    });
  } catch {
    // silencioso
  }
}
