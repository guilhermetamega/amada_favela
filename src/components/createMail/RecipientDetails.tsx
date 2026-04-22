import { MailPlus, MapPin } from "lucide-react";
import type { MailItem, MailRecipient } from "@/services/supabase/mail";
import { buildAddressLine } from "@/utils/address";

type RecipientWithPriority = MailRecipient & {
  isPartnerActive?: boolean;
};

type Props = {
  recipient: RecipientWithPriority | null;
  mailItems: MailItem[];
  loading: boolean;
  onOpenCreateModal: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

export default function RecipientDetails({
  recipient,
  mailItems,
  loading,
  onOpenCreateModal,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {!recipient ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Selecione um usuário para visualizar e criar cartas.
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                  {recipient.fullname}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin size={14} />
                  <span>
                    {buildAddressLine(
                      recipient.address_1,
                      recipient.address_number,
                    )}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {recipient.address_2 || "Sem complemento"}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <MailPlus size={16} />
                Endereçar nova carta
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
                  />
                ))}
              </div>
            ) : mailItems.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Nenhuma carta pendente para este usuário.
              </div>
            ) : (
              <div className="space-y-3">
                {mailItems.map((mail) => (
                  <article
                    key={mail.id}
                    className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                      {mail.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Expira em {formatDate(mail.expires_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
