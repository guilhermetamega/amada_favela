import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "./ThemeProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </AuthProvider>
  );
}
