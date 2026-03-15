import { useContext } from "react";
import { ProfileContext } from "@/contexts/ProfileContext";

export function usePermissions() {
  return useContext(ProfileContext);
}
