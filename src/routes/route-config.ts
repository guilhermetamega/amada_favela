import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Dog,
  FolderSearch,
  Home,
  LayoutDashboard,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { Permissions } from "@/lib/permissions";

export type AppRouteConfig = {
  path: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  showInSidebar?: boolean;
  showInDashboard?: boolean;
  isDetailRoute?: boolean;
  canAccess: (permissions: Permissions | null) => boolean;
};

export const appRoutes: AppRouteConfig[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    showInSidebar: true,
    showInDashboard: false,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found",
    label: "Achados e Perdidos",
    description: "Acesse os itens encontrados e perdidos.",
    icon: FolderSearch,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found/:id",
    label: "Detalhe Achados e Perdidos",
    icon: FolderSearch,
    showInSidebar: false,
    showInDashboard: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-animals",
    label: "Animais Perdidos",
    description: "Acesse os animais encontrados e perdidos.",
    icon: Dog,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-animals/:id",
    label: "Detalhe Animais Perdidos",
    icon: Dog,
    showInSidebar: false,
    showInDashboard: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/home-rent",
    label: "Moradia",
    description: "Acesse as casas para comprar e alugar.",
    icon: Home,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/home-rent/:id",
    label: "Detalhe Moradia",
    icon: Home,
    showInSidebar: false,
    showInDashboard: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/mails",
    label: "Minhas Cartas",
    description: "Visualize e confirme o recebimento das suas cartas.",
    icon: Mail,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions && permissions.canAccessPremium,
  },
  {
    path: "/dashboard/admin",
    label: "Administração",
    description:
      "Gerencie funções administrativas e recursos da sua comunidade.",
    icon: ShieldCheck,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) =>
      !!permissions && (permissions.isPresident || permissions.isAdmin),
  },
  {
    path: "/dashboard/admin/mail",
    label: "Criar Notificação de Cartas",
    description: "Gerencie cartas por usuário da comunidade.",
    icon: Bell,
    showInSidebar: true,
    showInDashboard: false,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/dashboard/super-admin",
    label: "Super Admin",
    description: "Gerencie funções globais dos usuários.",
    icon: Shield,
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions && permissions.isAdmin,
  },
];

export function getSidebarRoutes(permissions: Permissions | null) {
  return appRoutes.filter(
    (route) => route.showInSidebar && route.canAccess(permissions),
  );
}

export function getDashboardRoutes(permissions: Permissions | null) {
  return appRoutes.filter(
    (route) => route.showInDashboard && route.canAccess(permissions),
  );
}
