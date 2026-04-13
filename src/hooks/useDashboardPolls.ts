import { useEffect, useState } from "react";
import { getVisiblePolls, voteOnPoll } from "@/services/supabase/polls";
import type { Poll } from "@/types/polls";

export function useDashboardPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingVote, setPendingVote] = useState<{
    pollId: string;
    optionId: string;
    optionLabel: string;
  } | null>(null);

  const [voteLoading, setVoteLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await getVisiblePolls();
      setPolls(data);
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

      await voteOnPoll(pendingVote.pollId, pendingVote.optionId);

      await load();
      setPendingVote(null);
    } finally {
      setVoteLoading(false);
    }
  }

  return {
    polls,
    loading,
    pendingVote,
    setPendingVote,
    confirmVote,
    voteLoading,
  };
}
