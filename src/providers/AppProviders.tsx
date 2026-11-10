import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { CommunitiesProvider } from "@/contexts/CommunitiesContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CommunitiesProvider>
      <AuthProvider>
        <ProfileProvider>{children}</ProfileProvider>
      </AuthProvider>
    </CommunitiesProvider>
  );
}
