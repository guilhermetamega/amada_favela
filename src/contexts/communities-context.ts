import { createContext } from "react";
import { getDefaultCommunities } from "@/lib/communities";
import type { CommunityData } from "@/types/community";

export type CommunitiesContextValue = {
  communities: CommunityData[];
  loading: boolean;
};

export const CommunitiesContext = createContext<CommunitiesContextValue>({
  communities: getDefaultCommunities(),
  loading: true,
});
