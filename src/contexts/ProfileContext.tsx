import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCurrentUserProfile,
  getPartnerStatus,
} from "@/services/supabase/profile";
import { buildPermissions, type Permissions } from "@/lib/permissions";
import { ProfileContext } from "./profile-context";

export type ProfileContextType = {
  permissions: Permissions | null;
  loading: boolean;
  community: string | null;
  isPartnerActive: boolean;
  refreshPermissions: () => Promise<void>;
};

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [community, setCommunity] = useState<string | null>(null);
  const [isPartnerActive, setIsPartnerActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      setCommunity(null);
      setIsPartnerActive(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const profile = await getCurrentUserProfile(user.id);
      const partnerActive = await getPartnerStatus(user.id);

      setCommunity(profile.comunity ?? null);
      setIsPartnerActive(partnerActive);
      setPermissions(buildPermissions(profile.role, partnerActive));
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissions(null);
      setCommunity(null);
      setIsPartnerActive(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void loadPermissions();
  }, [authLoading, loadPermissions]);

  const value = useMemo(
    () => ({
      permissions,
      loading: authLoading || loading,
      community,
      isPartnerActive,
      refreshPermissions: loadPermissions,
    }),
    [
      permissions,
      loading,
      authLoading,
      community,
      isPartnerActive,
      loadPermissions,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
