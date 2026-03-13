import { ProfileContextType } from "@/contexts/ProfileContext";
import { createContext, useContext } from "react";

export const ProfileContext = createContext<ProfileContextType>({
  permissions: null,
  loading: true,
});

export function usePermissions() {
  return useContext(ProfileContext);
}
