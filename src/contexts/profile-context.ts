import { createContext, useContext } from "react";
import { ProfileContextType } from "./ProfileContext";

export const ProfileContext = createContext<ProfileContextType>({
  permissions: null,
  loading: true,
  community: null,
  isPartnerActive: false,
  refreshPermissions: async () => {},
});

export function usePermissions() {
  return useContext(ProfileContext);
}
