type Props = {
  id: string;
  title: string;
  description?: string;
  accept?: string;
  loading?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function MediaUploadCard({
  id,
  title,
  description,
  accept = "image/*",
  loading = false,
  onChange,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {title}
      </label>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-violet-500 dark:file:text-white"
        />

        {description ? (
          <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Enviando arquivo...
          </p>
        ) : null}
      </div>
    </div>
  );
}
