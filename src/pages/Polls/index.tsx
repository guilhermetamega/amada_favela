import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import PollsHero from "@/components/polls/Hero";
import PollsFeedback from "@/components/polls/Feedback";
import PollCard from "@/components/polls/PollCard";
import VoteConfirmModal from "@/components/polls/VoteConfirmModal";
import { getVisiblePolls, voteOnPoll } from "@/services/supabase/polls";
import type { Poll } from "@/types/polls";
import MainLayout from "@/components/layout/MainLayout";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingVote, setPendingVote] = useState<{
    pollId: string;
    optionId: string;
    optionLabel: string;
  } | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getVisiblePolls();
        if (!active) return;
        setPolls(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar enquetes.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleConfirmVote() {
    if (!pendingVote) return;

    try {
      setVoteLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await voteOnPoll(pendingVote.pollId, pendingVote.optionId);
      const data = await getVisiblePolls();
      setPolls(data);
      setSuccessMessage("Voto registrado com sucesso.");
      setPendingVote(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao registrar voto.",
      );
    } finally {
      setVoteLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <PollsHero />

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
              Nenhuma enquete disponível no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={(pollId, optionId, optionLabel) =>
                    setPendingVote({ pollId, optionId, optionLabel })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </MainLayout>

      <VoteConfirmModal
        open={!!pendingVote}
        optionLabel={pendingVote?.optionLabel ?? ""}
        loading={voteLoading}
        onClose={() => setPendingVote(null)}
        onConfirm={handleConfirmVote}
      />
    </DashboardLayout>
  );
}
