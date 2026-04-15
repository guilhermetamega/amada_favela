import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getSponsorSessionToken } from "@/lib/sponsorSession";

export default function SponsorSessionGuard() {
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = getSponsorSessionToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasToken(!!token);
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        Carregando...
      </div>
    );
  }

  if (!hasToken) {
    return <Navigate to="/sponsor/login" replace />;
  }

  return <Outlet />;
}
