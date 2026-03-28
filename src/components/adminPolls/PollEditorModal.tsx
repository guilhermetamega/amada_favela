import { useEffect, useState } from "react";
import type { Poll, PollStatus } from "@/types/polls";
import PollForm from "@/components/polls/PollForm";

type Props = {
  open: boolean;
  poll?: Poll | null;
  loading: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    description: string;
    voting_ends_at: string;
    visible_until: string;
    options: string[];
  }) => Promise<void>;
  onUpdate: (input: {
    pollId: string;
    title: string;
    description: string;
    voting_ends_at: string;
    visible_until: string;
    status: PollStatus;
    options: string[];
  }) => Promise<void>;
};

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PollEditorModal({
  open,
  poll,
  loading,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingEndsAt, setVotingEndsAt] = useState("");
  const [visibleUntil, setVisibleUntil] = useState("");
  const [status, setStatus] = useState<PollStatus>("active");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => {
    if (!open) return;

    if (!poll) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle("");
      setDescription("");
      setVotingEndsAt("");
      setVisibleUntil("");
      setStatus("active");
      setOptions(["", ""]);
      return;
    }

    setTitle(poll.title);
    setDescription(poll.description ?? "");
    setVotingEndsAt(toLocalDateTime(poll.voting_ends_at));
    setVisibleUntil(toLocalDateTime(poll.visible_until));
    setStatus(poll.status);
    setOptions(poll.options.map((item) => item.label));
  }, [open, poll]);

  if (!open) return null;

  async function handleSubmit() {
    if (poll) {
      await onUpdate({
        pollId: poll.id,
        title,
        description,
        voting_ends_at: new Date(votingEndsAt).toISOString(),
        visible_until: new Date(visibleUntil).toISOString(),
        status,
        options,
      });
      return;
    }

    await onCreate({
      title,
      description,
      voting_ends_at: new Date(votingEndsAt).toISOString(),
      visible_until: new Date(visibleUntil).toISOString(),
      options,
    });
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {poll ? "Editar enquete" : "Nova enquete"}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Fechar
            </button>
          </div>

          <PollForm
            title={title}
            description={description}
            votingEndsAt={votingEndsAt}
            visibleUntil={visibleUntil}
            status={poll ? status : undefined}
            options={options}
            loading={loading}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onVotingEndsAtChange={setVotingEndsAt}
            onVisibleUntilChange={setVisibleUntil}
            onStatusChange={poll ? setStatus : undefined}
            onOptionChange={updateOption}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onSubmit={handleSubmit}
            submitLabel={poll ? "Salvar alterações" : "Criar enquete"}
          />
        </div>
      </div>
    </div>
  );
}
