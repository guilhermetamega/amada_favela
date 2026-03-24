import {
  getCurrentCommunityBannerData,
  getCommunityImageSignedUrl,
} from "@/services/supabase/community_data";

export async function prefetchDashboard() {
  try {
    const { communityData } = await getCurrentCommunityBannerData();

    if (communityData?.picture_path) {
      const url = await getCommunityImageSignedUrl(communityData.picture_path);

      // 🔥 força cache da imagem no browser
      const img = new Image();
      img.src = url;
    }
  } catch {
    // silencioso
  }
}
