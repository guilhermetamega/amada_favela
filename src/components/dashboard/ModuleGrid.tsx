import { memo } from "react";
import { useNavigate } from "react-router-dom";
import type { AppRouteConfig } from "@/routes/route-config";
import NavigationButton from "@/components/ui/NavigationButton";
import { getNavigationButtonTheme } from "@/lib/navigation-button-theme";
import AssociationWhatsAppButton from "@/components/dashboard/AssociationWhatsappButton";

type Props = {
  routes: AppRouteConfig[];
};

function DashboardModuleGridComponent({ routes }: Props) {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {routes.map((route) => (
        <NavigationButton
          key={route.path}
          label={route.label}
          description={route.description}
          icon={route.icon}
          onClick={() => navigate(route.path)}
          color={getNavigationButtonTheme(route.colorClass)}
        />
      ))}
      <AssociationWhatsAppButton />
    </section>
  );
}

const DashboardModuleGrid = memo(DashboardModuleGridComponent);
export default DashboardModuleGrid;
