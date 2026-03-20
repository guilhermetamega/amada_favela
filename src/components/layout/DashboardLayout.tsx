import type { ReactNode } from "react";
import Sidebar from "@/components/ui/SideBar";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar />

      <div className="pt-8">{children}</div>
    </div>
  );
}
