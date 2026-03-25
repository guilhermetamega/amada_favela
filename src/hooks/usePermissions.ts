import { useContext } from "react";
import { ProfileContext } from "@/contexts/profile-context";

export function usePermissions() {
  return useContext(ProfileContext);
}
