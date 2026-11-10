import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_NAMES: Record<string, string> = {
  "/": "Autenticação",
  "/auth": "Autenticação",
  "/dashboard": "Painel",
  "/profile": "Perfil",
  "/lost-and-found": "Achados e perdidos",
  "/missing": "Animais desaparecidos",
  "/home-rent": "Aluguel de imóveis",
  "/polls": "Enquetes",
  "/bingo": "Bingo",
  "/service-orders": "Ordens de serviço",
  "/mails": "Cartas",
  "/member-card": "Carteirinha",
  "/proof-of-residence": "Comprovante de residência",
  "/resume-builder": "Currículo",
  "/social-projects": "Projetos sociais",
  "/garbage-schedules": "Coleta de lixo",
  "/admin": "Administração",
  "/super-admin": "Super administração",
};

function getRouteName(pathname: string) {
  if (ROUTE_NAMES[pathname]) return ROUTE_NAMES[pathname];

  const parentRoute = Object.keys(ROUTE_NAMES)
    .filter((route) => route !== "/" && pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];

  return parentRoute ? ROUTE_NAMES[parentRoute] : "Página";
}

export default function RouteAccessibility() {
  const { pathname } = useLocation();
  const firstRender = useRef(true);
  const routeName = getRouteName(pathname);

  useEffect(() => {
    document.title = `${routeName} | AMA da Favela`;

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    document.getElementById("app-content")?.focus({ preventScroll: true });
  }, [pathname, routeName]);

  return (
    <>
      <a className="skip-link" href="#app-content">
        Ir para o conteúdo principal
      </a>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {routeName}
      </p>
    </>
  );
}
