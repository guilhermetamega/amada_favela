import { useEffect, useState } from "react";
import {
  getCurrentUserProfile,
  getPartnerStatus,
} from "@/services/supabase/profile";
import { buildPermissions, type Permissions } from "@/lib/permissions";
import { ProfileContext } from "@/hooks/usePermissions";

export type ProfileContextType = {
  permissions: Permissions | null;
  loading: boolean;
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getCurrentUserProfile();
        const isPartnerActive = await getPartnerStatus(profile.id);

        const perms = buildPermissions(profile.role, isPartnerActive);

        setPermissions(perms);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ permissions, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}
