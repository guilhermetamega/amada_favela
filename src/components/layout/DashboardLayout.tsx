import type { ReactNode } from "react";
import Sidebar from "@/components/ui/SideBar";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />

      <div className="pt-16">{children}</div>
    </div>
  );
}
