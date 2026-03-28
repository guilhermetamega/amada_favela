import { Store } from "lucide-react";
import NavigationButton from "@/components/ui/NavigationButton";
import { getDashboardRouteTheme } from "@/lib/route-theme";
import { EXTERNAL_LINKS } from "@/lib/external-links";

function getPlatformTargetUrl() {
  if (typeof window === "undefined") {
    return EXTERNAL_LINKS.LOJAS_WEBSITE;
  }

  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  const isAndroid = /Android/i.test(userAgent);
  const isIPhone = /iPhone/i.test(userAgent);
  const isIPad =
    /iPad/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
  const isIPod = /iPod/i.test(userAgent);
  const isIOS = isIPhone || isIPad || isIPod;

  if (isAndroid) return EXTERNAL_LINKS.LOJAS_PLAYSTORE;
  if (isIOS) return EXTERNAL_LINKS.LOJAS_APPSTORE;

  return EXTERNAL_LINKS.LOJAS_WEBSITE;
}

export default function LojasDasComunidadesButton() {
  const theme = getDashboardRouteTheme("rose");

  function handleClick() {
    const url = getPlatformTargetUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <NavigationButton
      label="Lojas das Comunidades"
      description="Abra o destino correto para sua plataforma."
      onClick={handleClick}
      icon={Store}
      color={theme}
    />
  );
}
