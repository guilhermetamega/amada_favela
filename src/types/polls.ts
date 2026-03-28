export type PollStatus = "active" | "archived";

export type PollOption = {
  id: string;
  poll_id: string;
  label: string;
  position: number;
  votes_count?: number;
  percentage?: number;
};

export type Poll = {
  id: string;
  community: string;
  title: string;
  description: string | null;
  status: PollStatus;
  created_by: string;
  voting_ends_at: string;
  visible_until: string;
  created_at: string;
  updated_at: string;
  options: PollOption[];
  total_votes: number;
  has_voted: boolean;
  user_vote_option_id: string | null;
  voting_open: boolean;
  visible_now: boolean;
};

export type CreatePollInput = {
  title: string;
  description: string;
  voting_ends_at: string;
  visible_until: string;
  options: string[];
};

export type UpdatePollInput = {
  pollId: string;
  title: string;
  description: string;
  voting_ends_at: string;
  visible_until: string;
  status: PollStatus;
  options: string[];
};
