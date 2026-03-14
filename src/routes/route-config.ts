import type { Permissions } from "@/lib/permissions";

export type AppRouteConfig = {
  path: string;
  label: string;
  showInSidebar?: boolean;
  isDetailRoute?: boolean;
  canAccess: (permissions: Permissions | null) => boolean;
};

export const appRoutes: AppRouteConfig[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    showInSidebar: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found",
    label: "Achados e Perdidos",
    showInSidebar: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-and-found/:id",
    label: "Detalhe Achados e Perdidos",
    showInSidebar: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-animals",
    label: "Animais Perdidos",
    showInSidebar: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/lost-animals/:id",
    label: "Detalhe Animais Perdidos",
    showInSidebar: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/home-rent",
    label: "Moradia",
    showInSidebar: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/home-rent/:id",
    label: "Detalhe Moradia",
    showInSidebar: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/dashboard/admin",
    label: "Administração",
    showInSidebar: true,
    canAccess: (permissions) =>
      !!permissions && (permissions.isPresident || permissions.isAdmin),
  },
  {
    path: "/dashboard/admin/mail",
    label: "Entrega de Cartas",
    showInSidebar: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/dashboard/super-admin",
    label: "Super Admin",
    showInSidebar: true,
    canAccess: (permissions) => !!permissions && permissions.isAdmin,
  },
];

export function getSidebarRoutes(permissions: Permissions | null) {
  return appRoutes.filter((route) => {
    if (!route.showInSidebar) return false;
    return route.canAccess(permissions);
  });
}
