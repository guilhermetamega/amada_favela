import {
  createContext,
  useContext,
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

export type ProfileContextType = {
  permissions: Permissions | null;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ProfileContext = createContext<ProfileContextType>({
  permissions: null,
  loading: true,
  refreshPermissions: async () => {},
});

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const profile = await getCurrentUserProfile(user.id);
      const isPartnerActive = await getPartnerStatus(user.id);

      setPermissions(buildPermissions(profile.role, isPartnerActive));
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissions(null);
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
      refreshPermissions: loadPermissions,
    }),
    [permissions, loading, authLoading, loadPermissions],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermissions() {
  return useContext(ProfileContext);
}
