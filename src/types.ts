export type GameType = "tictactoe" | "archery";

export type GameMode = "single_ai" | "local_pvp" | "online_room" | "quick_match";

export type AIDifficulty = "easy" | "medium" | "hard";

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  rating: number;
  stats: {
    tictactoe: {
      played: number;
      won: number;
      lost: number;
      draws: number;
      streak: number;
      bestStreak: number;
    };
    archery: {
      played: number;
      highScore: number;
      bullseyes: number;
      totalScore: number;
      avgAccuracy: number;
    };
  };
  achievements: string[]; // achievement IDs
}

export interface MatchHistoryItem {
  id: string;
  gameType: GameType;
  gameName: string;
  timestamp: number;
  opponent: string;
  mode: GameMode;
  result: "win" | "loss" | "draw" | "completed";
  scoreText: string;
}

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type AchievementType = "milestone" | "skill" | "exploration";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  game: GameType | "general";
  tier: AchievementTier;
  type: AchievementType;
  xpReward: number;
  coinReward: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  wins: number;
  game: "all" | "tictactoe" | "archery";
  rankTitle: string;
  isCurrentUser?: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  gameType: GameType;
  prizePool: string;
  entryFee: number;
  participants: number;
  maxParticipants: number;
  status: "active" | "upcoming" | "ended";
  endsIn: string;
  badge: string;
}

// Multiplayer Room types
export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  symbol?: "X" | "O";
  score: number;
  ready?: boolean;
}

export interface ServerRoom {
  id: string;
  gameType: GameType;
  isPrivate: boolean;
  status: "waiting" | "playing" | "ended";
  createdAt: number;
  players: RoomPlayer[];
  tictactoeState?: {
    board: (string | null)[];
    turn: "X" | "O";
    winner: "X" | "O" | "draw" | null;
    winningLine: number[] | null;
    rematchVotes: string[];
  };
  archeryState?: {
    currentRound: number;
    maxRounds: number;
    currentShooterIndex: number;
    shotsLeftInRound: Record<string, number>;
    scores: Record<string, number>;
    lastShot: {
      playerId: string;
      score: number;
      accuracyRing: string;
      isBullseye: boolean;
      wind: number;
      distance: number;
    } | null;
    rematchVotes: string[];
  };
}
