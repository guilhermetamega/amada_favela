import type { PollStatus } from "@/types/polls";

type Props = {
  title: string;
  description: string;
  votingEndsAt: string;
  visibleUntil: string;
  status?: PollStatus;
  options: string[];
  loading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onVotingEndsAtChange: (value: string) => void;
  onVisibleUntilChange: (value: string) => void;
  onStatusChange?: (value: PollStatus) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onSubmit: () => void;
  submitLabel: string;
};

export default function PollForm({
  title,
  description,
  votingEndsAt,
  visibleUntil,
  status,
  options,
  loading,
  onTitleChange,
  onDescriptionChange,
  onVotingEndsAtChange,
  onVisibleUntilChange,
  onStatusChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSubmit,
  submitLabel,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Título
        </label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fim da votação
          </label>
          <input
            type="datetime-local"
            value={votingEndsAt}
            onChange={(e) => onVotingEndsAtChange(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fim da exibição
          </label>
          <input
            type="datetime-local"
            value={visibleUntil}
            onChange={(e) => onVisibleUntilChange(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      {onStatusChange ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as PollStatus)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="active">Ativa</option>
            <option value="archived">Arquivada</option>
          </select>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Opções
          </label>
          <button
            type="button"
            onClick={onAddOption}
            className="text-sm font-medium text-violet-700 dark:text-violet-300"
          >
            Adicionar opção
          </button>
        </div>

        {options.map((option, index) => (
          <div key={index} className="flex gap-3">
            <input
              value={option}
              onChange={(e) => onOptionChange(index, e.target.value)}
              className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder={`Opção ${index + 1}`}
            />
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => onRemoveOption(index)}
                className="rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-300"
              >
                Remover
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={onSubmit}
          className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
