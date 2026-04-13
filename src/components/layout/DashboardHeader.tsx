import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
};

export default function DashboardHeader({
  title,
  description,
  showBackButton = false,
  actions,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="mt-4 mb-8 flex items-center justify-center gap-4">
      <div className="flex items-start gap-4">
        {showBackButton ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            ←
          </button>
        ) : null}

        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
