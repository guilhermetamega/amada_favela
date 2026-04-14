import { useEffect, useState } from "react";
import { getVisiblePolls, voteOnPoll } from "@/services/supabase/polls";
import type { Poll } from "@/types/polls";

export function useDashboardPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingVote, setPendingVote] = useState<{
    pollId: string;
    optionId: string;
    optionLabel: string;
  } | null>(null);

  const [voteLoading, setVoteLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getVisiblePolls();
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
    void load();
  }, []);

  async function confirmVote() {
    if (!pendingVote) return;

    try {
      setVoteLoading(true);
      setErrorMessage("");

      await voteOnPoll(pendingVote.pollId, pendingVote.optionId);

      const data = await getVisiblePolls();
      setPolls(data);
      setPendingVote(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao registrar voto.",
      );
    } finally {
      setVoteLoading(false);
    }
  }

  return {
    polls,
    loading,
    errorMessage,
    pendingVote,
    setPendingVote,
    confirmVote,
    voteLoading,
    reload: load,
  };
}
