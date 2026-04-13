import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import AdminMailHero from "@/components/createMail/Hero";
import AdminMailFeedback from "@/components/createMail/Feedback";
import AdminMailPageSkeleton from "@/components/createMail/PageSkeleton";
import RecipientsList from "@/components/createMail/RecipientsList";
import RecipientDetails from "@/components/createMail/RecipientDetails";
import CreateMailModal from "@/components/createMail/CreateModal";
import {
  getEligibleMailRecipients,
  getUserPendingMail,
  type MailItem,
  type MailRecipient,
} from "@/services/supabase/mail";
import MainLayout from "@/components/layout/MainLayout";

type RecipientWithPriority = MailRecipient & {
  isPartnerActive?: boolean;
};

function sortRecipients(items: RecipientWithPriority[]) {
  return [...items].sort((a, b) => {
    const premiumA = a.isPartnerActive ? 1 : 0;
    const premiumB = b.isPartnerActive ? 1 : 0;

    if (premiumA !== premiumB) {
      return premiumB - premiumA;
    }

    return a.fullname.localeCompare(b.fullname, "pt-BR");
  });
}

export default function AdminMailPage() {
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<RecipientWithPriority[]>([]);
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientWithPriority | null>(null);
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [loadingMail, setLoadingMail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadRecipients() {
      try {
        setLoadingRecipients(true);
        setErrorMessage("");

        const data = await getEligibleMailRecipients(search);

        setRecipients(sortRecipients(data as RecipientWithPriority[]));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        setErrorMessage(message);
      } finally {
        setLoadingRecipients(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadRecipients();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  async function handleSelectRecipient(recipient: RecipientWithPriority) {
    try {
      setSelectedRecipient(recipient);
      setLoadingMail(true);
      setErrorMessage("");

      const data = await getUserPendingMail(recipient.id);
      setMailItems(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar cartas.";
      setErrorMessage(message);
    } finally {
      setLoadingMail(false);
    }
  }

  function handleMailCreated(mail: MailItem) {
    setMailItems((prev) => [mail, ...prev]);
  }

  const showPageSkeleton = useMemo(
    () => loadingRecipients && recipients.length === 0,
    [loadingRecipients, recipients.length],
  );

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-7xl space-y-4">
          <AdminMailHero />

          <AdminMailFeedback errorMessage={errorMessage} />

          {showPageSkeleton ? (
            <AdminMailPageSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <RecipientsList
                search={search}
                onSearchChange={setSearch}
                recipients={recipients}
                selectedRecipient={selectedRecipient}
                loading={loadingRecipients}
                onSelect={(recipient) => void handleSelectRecipient(recipient)}
              />

              <RecipientDetails
                recipient={selectedRecipient}
                mailItems={mailItems}
                loading={loadingMail}
                onOpenCreateModal={() => setIsModalOpen(true)}
              />
            </div>
          )}
        </div>
      </MainLayout>

      <CreateMailModal
        isOpen={isModalOpen}
        recipient={selectedRecipient}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleMailCreated}
      />
    </DashboardLayout>
  );
}
