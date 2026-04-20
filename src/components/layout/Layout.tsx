import type { ReactNode } from "react";
import SideBar from "@/components/ui/SideBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import developedByLogo from "@/assets/developed_by_logo.png";

type Props = {
  children: ReactNode;
  hasLogo?: boolean;
};

export default function Layout({ children, hasLogo = false }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-gradient-to-b dark:from-zinc-900 dark:via-emerald-950/10 dark:to-zinc-950 dark:text-zinc-100">
      <div className="hidden md:block">
        <SideBar />
      </div>

      <div className="lg:pl-0 sm:pl-76">
        <div className={`min-h-screen ${hasLogo ? "pb-0" : "pb-56"} md:pb-0`}>
          {children}
        </div>

        {hasLogo && (
          <div className="block pb-38 bg-zinc-50 text-zinc-900 transition-colors dark:bg-gradient-to-b dark:from-zinc-900 dark:via-emerald-950/10 dark:to-zinc-950 dark:text-zinc-100">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Desenvolvido Pela Equipe das:
            </p>

            <div className="mt-2 flex justify-center">
              <img
                src={developedByLogo}
                alt="Equipe de Desenvolvimento"
                className="h-10 object-contain opacity-85 transition hover:opacity-100"
              />
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}