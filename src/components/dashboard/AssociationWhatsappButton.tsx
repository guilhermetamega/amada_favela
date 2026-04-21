import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import NavigationButton from "@/components/ui/NavigationButton";
import { getDashboardRouteTheme } from "@/lib/route-theme";
import {
  getAssociationWhatsAppLink,
  type AssociationContactData,
} from "@/services/supabase/association_public";

type LoadState = {
  loading: boolean;
  contact: AssociationContactData | null;
  url: string | null;
  error: string | null;
};

export default function AssociationWhatsAppButton() {
  const [state, setState] = useState<LoadState>({
    loading: true,
    contact: null,
    url: null,
    error: null,
  });

  const theme = getDashboardRouteTheme("emerald");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setState((current) => ({ ...current, loading: true, error: null }));

        const { contact, url } = await getAssociationWhatsAppLink();

        if (!active) return;

        setState({
          loading: false,
          contact,
          url,
          error: null,
        });
      } catch (error) {
        if (!active) return;

        setState({
          loading: false,
          contact: null,
          url: null,
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o WhatsApp da associação.",
        });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const label = "WhatsApp da Associação";
  const description = state.loading
    ? "Carregando contato da associação..."
    : state.url && state.contact
      ? `Fale com ${state.contact.name || "a associação"}`
      : "WhatsApp não disponível";

  return (
    <NavigationButton
      label={label}
      description={description}
      icon={MessageCircle}
      color={theme}
      href={state.url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      disabled={state.loading || !state.url}
      onClick={() => {
        console.log("[AssociationWhatsAppButton] state", state);
      }}
    />
  );
}
