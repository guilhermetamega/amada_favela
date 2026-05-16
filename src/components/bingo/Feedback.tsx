type Props = {
  errorMessage?: string;
  successMessage?: string;
};

export default function BingoFeedback({ errorMessage, successMessage }: Props) {
  if (!errorMessage && !successMessage) return null;

  return (
    <div className="space-y-2 text-sm">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {successMessage}
        </div>
      ) : null}
    </div>
  );
}
