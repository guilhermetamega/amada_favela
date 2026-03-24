type Props = {
  errorMessage?: string;
  successMessage?: string;
  partnerActionMessage?: string;
};

export default function ProfileFeedback({
  errorMessage,
  successMessage,
  partnerActionMessage,
}: Props) {
  if (!errorMessage && !successMessage && !partnerActionMessage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {partnerActionMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {partnerActionMessage}
        </div>
      ) : null}
    </div>
  );
}
