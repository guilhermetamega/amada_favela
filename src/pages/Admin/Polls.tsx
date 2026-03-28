import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import PollsHero from "@/components/polls/Hero";
import PollsFeedback from "@/components/polls/Feedback";
import PollEditorModal from "@/components/adminPolls/PollEditorModal";
import PollManagementCard from "@/components/adminPolls/PollManagementCard";
import {
  createPoll,
  getManageablePolls,
  updatePoll,
} from "@/services/supabase/polls";
import type { Poll, PollStatus } from "@/types/polls";

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  async function loadPolls() {
    try {
      setLoading(true);
      const data = await getManageablePolls();
      setPolls(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar enquetes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPolls();
  }, []);

  async function handleCreate(input: {
    title: string;
    description: string;
    voting_ends_at: string;
    visible_until: string;
    options: string[];
  }) {
    try {
      setModalLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      await createPoll(input);
      await loadPolls();
      setSuccessMessage("Enquete criada com sucesso.");
      setModalOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar enquete.",
      );
    } finally {
      setModalLoading(false);
    }
  }

  async function handleUpdate(input: {
    pollId: string;
    title: string;
    description: string;
    voting_ends_at: string;
    visible_until: string;
    status: PollStatus;
    options: string[];
  }) {
    try {
      setModalLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      await updatePoll(input);
      await loadPolls();
      setSuccessMessage("Enquete atualizada com sucesso.");
      setModalOpen(false);
      setEditingPoll(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar enquete.",
      );
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <PollsHero title="Gerenciar Enquetes" />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setEditingPoll(null);
                setModalOpen(true);
              }}
              className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Nova enquete
            </button>
          </div>

          <PollsFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Nenhuma enquete criada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollManagementCard
                  key={poll.id}
                  poll={poll}
                  onEdit={(nextPoll) => {
                    setEditingPoll(nextPoll);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <PollEditorModal
        open={modalOpen}
        poll={editingPoll}
        loading={modalLoading}
        onClose={() => {
          setModalOpen(false);
          setEditingPoll(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </DashboardLayout>
  );
}
