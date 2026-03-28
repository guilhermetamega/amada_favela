type Props = {
  errorMessage?: string;
};

export default function AdminMailFeedback({ errorMessage }: Props) {
  if (!errorMessage) return null;

  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
      {errorMessage}
    </div>
  );
}
