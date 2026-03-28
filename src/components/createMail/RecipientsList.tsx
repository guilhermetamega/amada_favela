import { useMemo, useState } from "react";
import { ChevronDown, Crown, MapPin, Search } from "lucide-react";
import type { MailRecipient } from "@/services/supabase/mail";

type RecipientWithPriority = MailRecipient & {
  isPartnerActive?: boolean;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  recipients: RecipientWithPriority[];
  selectedRecipient: RecipientWithPriority | null;
  loading: boolean;
  onSelect: (recipient: RecipientWithPriority) => void;
};

function RecipientTag({ active }: { active?: boolean }) {
  if (!active) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
      <Crown size={12} />
      Sócio ativo
    </span>
  );
}

function RecipientCard({
  recipient,
  selected,
  onClick,
}: {
  recipient: RecipientWithPriority;
  selected: boolean;
  onClick: () => void;
}) {
  const isPremium = !!recipient.isPartnerActive;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        selected
          ? "border-violet-500 bg-violet-500/10"
          : isPremium
            ? "border-amber-300/60 bg-amber-500/5 hover:bg-amber-500/10 dark:border-amber-500/30"
            : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
            {recipient.fullname}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin size={14} />
            <span className="truncate">{recipient.address_1}</span>
          </div>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {recipient.address_2 || "Sem complemento"}
          </p>
        </div>

        <RecipientTag active={recipient.isPartnerActive} />
      </div>
    </button>
  );
}

export default function RecipientsSelector({
  search,
  onSearchChange,
  recipients,
  selectedRecipient,
  loading,
  onSelect,
}: Props) {
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const othersCount = useMemo(() => {
    if (!selectedRecipient) return recipients.length;
    return Math.max(recipients.length - 1, 0);
  }, [recipients.length, selectedRecipient]);

  function handleSelect(recipient: RecipientWithPriority) {
    onSelect(recipient);
    setMobileListOpen(false);
  }

  return (
    <>
      <section className="xl:hidden">
        <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Destinatários
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Sócios ativos aparecem primeiro na listagem.
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Pesquisar por nome..."
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              />
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setMobileListOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Destinatário selecionado
                  </p>

                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedRecipient?.fullname || "Selecione um usuário"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedRecipient
                      ? selectedRecipient.address_1
                      : recipients.length > 0
                        ? `${recipients.length} usuários disponíveis`
                        : "Nenhum usuário encontrado"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {othersCount > 0 ? (
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                      +{othersCount}
                    </span>
                  ) : null}

                  <span
                    className={`rounded-2xl border border-zinc-200 p-2 text-zinc-600 transition dark:border-zinc-700 dark:text-zinc-300 ${
                      mobileListOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown size={16} />
                  </span>
                </div>
              </button>

              {mobileListOpen ? (
                <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-24 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
                        />
                      ))}
                    </div>
                  ) : recipients.length === 0 ? (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    <div className="max-h-[45dvh] space-y-3 overflow-y-auto pr-1">
                      {recipients.map((recipient) => (
                        <RecipientCard
                          key={recipient.id}
                          recipient={recipient}
                          selected={selectedRecipient?.id === recipient.id}
                          onClick={() => handleSelect(recipient)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:block">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
            Destinatários
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sócios ativos aparecem primeiro na listagem.
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Pesquisar por nome..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
                  />
                ))}
              </>
            ) : recipients.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Nenhum usuário encontrado.
              </div>
            ) : (
              recipients.map((recipient) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  selected={selectedRecipient?.id === recipient.id}
                  onClick={() => onSelect(recipient)}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
