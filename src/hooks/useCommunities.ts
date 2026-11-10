import { useContext } from "react";
import { CommunitiesContext } from "@/contexts/communities-context";

export function useCommunities() {
  return useContext(CommunitiesContext);
}
