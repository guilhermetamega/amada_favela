type Props = {
  errorMessage?: string;
  successMessage?: string;
};

export default function PollsFeedback({ errorMessage, successMessage }: Props) {
  if (!errorMessage && !successMessage) return null;

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}
    </div>
  );
}
