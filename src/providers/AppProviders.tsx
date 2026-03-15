import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
