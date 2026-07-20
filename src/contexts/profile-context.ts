import { createContext, useContext } from "react";
import type { ProfileContextType } from "./ProfileContext";

export const ProfileContext = createContext<ProfileContextType>({
  permissions: null,
  loading: true,
  error: null,

  community: null,
  associationId: null,
  isPartnerActive: false,
  passwordChangeRequired: false,

  refreshPermissions: async () => {},
});

export function usePermissions() {
  return useContext(ProfileContext);
}
