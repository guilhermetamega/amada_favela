import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Dog,
  FolderSearch,
  HeartHandshake,
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
  colorClass:
    | "emerald"
    | "amber"
    | "sky"
    | "rose"
    | "violet"
    | "cyan"
    | "orange";
  showInSidebar?: boolean;
  showInDashboard?: boolean;
  isDetailRoute?: boolean;
  canAccess: (permissions: Permissions | null) => boolean;
};

export const appRoutes: AppRouteConfig[] = [
  {
    path: "/dashboard",
    label: "Página Inicial",
    icon: LayoutDashboard,
    colorClass: "emerald",
    showInSidebar: true,
    showInDashboard: false,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found",
    label: "Achados e Perdidos",
    description: "Acesse os itens encontrados e perdidos.",
    icon: FolderSearch,
    colorClass: "amber",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found/:id",
    label: "Detalhe Achados e Perdidos",
    icon: FolderSearch,
    colorClass: "amber",
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
    colorClass: "rose",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-animals/:id",
    label: "Detalhe Animais Perdidos",
    icon: Dog,
    colorClass: "rose",
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
    colorClass: "sky",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/home-rent/:id",
    label: "Detalhe Moradia",
    icon: Home,
    colorClass: "sky",
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
    colorClass: "violet",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/admin",
    label: "Administração",
    description:
      "Gerencie funções administrativas e recursos da sua comunidade.",
    icon: ShieldCheck,
    colorClass: "cyan",
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
    colorClass: "orange",
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
    colorClass: "emerald",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions && permissions.isAdmin,
  },
  {
    path: "/dashboard/social-projects",
    label: "Projetos Sociais",
    description: "Conheça e apoie projetos sociais da comunidade.",
    icon: HeartHandshake,
    colorClass: "emerald",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/dashboard/social-projects/:id",
    label: "Detalhe Projeto Social",
    icon: HeartHandshake,
    colorClass: "emerald",
    showInSidebar: false,
    showInDashboard: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/admin/social-projects",
    label: "Gerenciar Projetos Sociais",
    description: "Crie, edite e exclua projetos sociais.",
    icon: HeartHandshake,
    colorClass: "emerald",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
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
