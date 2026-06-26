export type SortMode = "hottest" | "newest" | "spiciest" | "underdogs";

export type VoteValue = -1 | 1;

export type HeatTier = "Warm" | "Hot" | "Scorching" | "Nuclear";

export type SafetyLevel = "Clean debate" | "Needs care" | "Borderline";

export type Take = {
  id: string;
  authorId: string;
  authorName: string;
  squad: string;
  text: string;
  votes: number;
  spicinessScore: number;
  spicinessReason: string;
  heatTier: HeatTier;
  category: string;
  controversyType: string;
  audienceSplit: string;
  safetyLevel: SafetyLevel;
  tags: string[];
  createdAt: string;
  rebuttal?: string | null;
  steelman?: string | null;
  remix?: string | null;
  debateBrief?: string | null;
  viewerVote?: VoteValue | 0;
  combinedScore: number;
};

export type TakeRecord = Omit<Take, "viewerVote" | "combinedScore">;

export type VoteRecord = {
  takeId: string;
  userId: string;
  value: VoteValue;
};

export type LocalStore = {
  takes: TakeRecord[];
  votes: VoteRecord[];
};

export type ScoreResult = {
  score: number;
  reason: string;
  heatTier: HeatTier;
  category: string;
  controversyType: string;
  audienceSplit: string;
  safetyLevel: SafetyLevel;
  tags: string[];
};

export type SquadStanding = {
  squad: string;
  takes: number;
  votes: number;
  averageSpice: number;
  totalHeat: number;
};

export type ArenaStats = {
  totalTakes: number;
  totalVotes: number;
  averageSpice: number;
  nuclearTakes: number;
};
