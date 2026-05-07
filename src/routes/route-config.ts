import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  ClipboardPenLine,
  Dog,
  FolderSearch,
  HeartHandshake,
  Home,
  IdCard,
  LayoutDashboard,
  Mail,
  Megaphone,
  Shield,
  ShieldCheck,
  UserCircle2,
  Building2,
  Wrench,
  Trash2,
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
  showInMobileNav?: boolean;
  showInAdmin?: boolean;
  isPremium?: boolean;
  isDetailRoute?: boolean;
  canAccess: (permissions: Permissions | null) => boolean;
};

export function getMobileNavRoutes(permissions: Permissions | null) {
  return appRoutes.filter(
    (route) =>
      route.showInMobileNav &&
      !route.isDetailRoute &&
      route.canAccess(permissions),
  );
}

export const appRoutes: AppRouteConfig[] = [
  {
    path: "/dashboard",
    label: "Início",
    icon: LayoutDashboard,
    colorClass: "emerald",
    showInSidebar: true,
    showInMobileNav: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/member-card",
    label: "Carteirinha",
    description: "Visualize e baixe sua carteirinha virtual de morador.",
    icon: IdCard,
    colorClass: "violet",
    showInSidebar: true,
    showInMobileNav: true,
    showInDashboard: true,
    isPremium: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/service-orders",
    label: "Ordens de Serviço",
    description: "Registre ocorrências de onde você mora.",
    icon: Wrench,
    colorClass: "orange",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/garbage-schedules",
    label: "Horários de lixo",
    description: "Consulte os horários da coleta na sua comunidade.",
    icon: Trash2,
    colorClass: "emerald",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/mails",
    label: "Cartas",
    description: "Visualize e confirme o recebimento das suas cartas.",
    icon: Mail,
    colorClass: "violet",
    showInSidebar: true,
    showInMobileNav: true,
    showInDashboard: true,
    isPremium: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/profile",
    label: "Perfil",
    description: "Gerencie seus dados, parceria e publicações.",
    icon: UserCircle2,
    colorClass: "emerald",
    showInSidebar: true,
    showInMobileNav: true,
    showInDashboard: false,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/proof-of-residence",
    label: "Declaração de Residência",
    description: "Gere seu comprovante institucional em PDF.",
    icon: IdCard,
    colorClass: "violet",
    showInSidebar: true,
    showInDashboard: true,
    isPremium: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/validate-proof/:validationCode",
    label: "Validação de Declaração de Residência",
    description: "Visualize se sua declaração ainda está em dia.",
    icon: IdCard,
    colorClass: "violet",
    showInSidebar: true,
    showInDashboard: false,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/lost-and-found",
    label: "Achados e Perdidos",
    description: "Acesse os itens encontrados e perdidos.",
    icon: FolderSearch,
    colorClass: "amber",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/missing",
    label: "Desaparecidos",
    description: "Acesse os animais e pessoas desaparecidas e encontradas.",
    icon: Dog,
    colorClass: "orange",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/home-rent",
    label: "Imóveis",
    description: "Acesse as casas para comprar e alugar.",
    icon: Home,
    colorClass: "sky",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/social-projects",
    label: "Projetos Sociais",
    description: "Conheça e apoie projetos sociais da comunidade.",
    icon: HeartHandshake,
    colorClass: "rose",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/polls",
    label: "Enquetes",
    description: "Vote e acompanhe resultados da sua comunidade.",
    icon: BarChart3,
    colorClass: "violet",
    showInSidebar: true,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/admin/polls",
    label: "Gerenciar Enquetes",
    description: "Crie e edite enquetes da comunidade.",
    icon: ClipboardPenLine,
    colorClass: "violet",
    showInSidebar: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin/service-orders",
    label: "Ocorrências",
    description: "Gerencie ocorrências abertas da comunidade.",
    icon: ClipboardList,
    colorClass: "orange",
    showInSidebar: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin",
    label: "Admin",
    description: "Gerencie funções administrativas e recursos da comunidade.",
    icon: ShieldCheck,
    colorClass: "cyan",
    showInSidebar: true,
    showInDashboard: true,
    showInMobileNav: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin/mail",
    label: "Notificações de Cartas",
    description: "Gerencie cartas por usuário da comunidade.",
    icon: Bell,
    colorClass: "orange",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin/association",
    label: "Associação",
    description: "Edite os dados institucionais usados em documentos e telas.",
    icon: Building2,
    colorClass: "orange",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions && (permissions.isAdmin || permissions.isPresident),
  },
  {
    path: "/admin/association/garbage-schedules",
    label: "Horários de lixo",
    description: "Configure os horários de passagem da coleta para o contador e push.",
    icon: Trash2,
    colorClass: "emerald",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/super-admin",
    label: "Super Admin",
    description: "Gerencie funções globais dos usuários.",
    icon: Shield,
    colorClass: "emerald",
    showInSidebar: false,
    showInDashboard: true,
    canAccess: (permissions) => !!permissions && permissions.isAdmin,
  },
  {
    path: "/social-projects/:id",
    label: "Detalhe Projeto Social",
    icon: HeartHandshake,
    colorClass: "rose",
    showInSidebar: false,
    showInDashboard: false,
    isDetailRoute: true,
    canAccess: (permissions) => !!permissions,
  },
  {
    path: "/admin/social-projects",
    label: "Projetos Sociais",
    description: "Crie, edite e exclua projetos sociais.",
    icon: HeartHandshake,
    colorClass: "rose",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin/create-warnings",
    label: "Avisos",
    description: "Crie, edite e exclua avisos para a comunidade.",
    icon: Megaphone,
    colorClass: "rose",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions &&
      (permissions.isEmployee ||
        permissions.isPresident ||
        permissions.isAdmin),
  },
  {
    path: "/admin/welcome-banner",
    label: "Banner de Entrada",
    description: "Edite a logo e a descrição exibidas no topo do dashboard.",
    icon: HeartHandshake,
    colorClass: "emerald",
    showInSidebar: false,
    showInDashboard: false,
    showInAdmin: true,
    canAccess: (permissions) =>
      !!permissions && (permissions.isAdmin || permissions.isPresident),
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

export function getAdminRoutes(permissions: Permissions | null) {
  return appRoutes.filter(
    (route) => route.showInAdmin && route.canAccess(permissions),
  );
}
