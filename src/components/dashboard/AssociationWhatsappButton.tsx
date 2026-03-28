import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import NavigationButton from "@/components/ui/NavigationButton";
import { getDashboardRouteTheme } from "@/lib/route-theme";
import {
  buildAssociationWhatsAppUrl,
  getAssociationContactData,
} from "@/services/supabase/association_public";

export default function AssociationWhatsAppButton() {
  const [loading, setLoading] = useState(true);
  const [associationName, setAssociationName] = useState("Associação");
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const theme = getDashboardRouteTheme("emerald");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const data = await getAssociationContactData();

        if (!active) return;

        setAssociationName(data.name || "Associação");
        setWhatsAppUrl(buildAssociationWhatsAppUrl(data.phone));
      } catch {
        if (!active) return;

        setWhatsAppUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function handleClick() {
    if (!whatsAppUrl) return;
    window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <NavigationButton
      label="WhatsApp"
      description={
        loading
          ? "Carregando contato da associação..."
          : whatsAppUrl
            ? `Fale com ${associationName}`
            : "WhatsApp não disponível"
      }
      onClick={handleClick}
      icon={MessageCircle}
      color={theme}
    />
  );
}
