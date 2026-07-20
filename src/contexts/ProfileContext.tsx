import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPartnerStatus } from "@/services/supabase/profile";
import { getCurrentUserAccessContext } from "@/services/supabase/access";
import { buildPermissions, type Permissions } from "@/lib/permissions";
import { ProfileContext } from "./profile-context";

export type ProfileContextType = {
  permissions: Permissions | null;
  loading: boolean;
  error: string | null;

  community: string | null;
  associationId: string | null;
  isPartnerActive: boolean;
  passwordChangeRequired: boolean;

  refreshPermissions: () => Promise<void>;
};

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const [community, setCommunity] = useState<string | null>(null);

  const [associationId, setAssociationId] = useState<string | null>(null);

  const [isPartnerActive, setIsPartnerActive] = useState(false);

  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resetContext = useCallback(() => {
    setPermissions(null);
    setCommunity(null);
    setAssociationId(null);
    setIsPartnerActive(false);
    setPasswordChangeRequired(false);
    setError(null);
  }, []);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      resetContext();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [accessContext, partnerActive] = await Promise.all([
        getCurrentUserAccessContext(),
        getPartnerStatus(user.id),
      ]);

      setCommunity(accessContext.community);
      setAssociationId(accessContext.associationId);
      setIsPartnerActive(partnerActive);
      setPasswordChangeRequired(accessContext.passwordChangeRequired);

      setPermissions(buildPermissions(accessContext, partnerActive));
    } catch (loadError) {
      console.error("Erro ao carregar contexto de acesso:", loadError);

      resetContext();

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar suas permissões.",
      );
    } finally {
      setLoading(false);
    }
  }, [resetContext, user]);

  useEffect(() => {
    if (authLoading) return;

    void loadPermissions();
  }, [authLoading, loadPermissions]);

  const value = useMemo(
    () => ({
      permissions,
      loading: authLoading || loading,
      error,

      community,
      associationId,
      isPartnerActive,
      passwordChangeRequired,

      refreshPermissions: loadPermissions,
    }),
    [
      permissions,
      authLoading,
      loading,
      error,
      community,
      associationId,
      isPartnerActive,
      passwordChangeRequired,
      loadPermissions,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
