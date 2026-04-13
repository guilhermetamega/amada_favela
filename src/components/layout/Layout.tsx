import type { ReactNode } from "react";
import SideBar from "@/components/ui/SideBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="hidden md:block">
        <SideBar />
      </div>

      <div className="lg:pl-0 sm:pl-76">
        <div className="min-h-screen pb-56 md:pb-0">{children}</div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
