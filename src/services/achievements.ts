import { Achievement, GameType, PlayerProfile } from "../types";
import { getOrCreatePlayerProfile, savePlayerProfile } from "./storage";
import { soundManager } from "./sound";
import { triggerHaptic } from "./telegram";
import confetti from "canvas-confetti";

export const MASTER_ACHIEVEMENTS: Achievement[] = [
  // ==================== TIC-TAC-TOE ACHIEVEMENTS ====================
  {
    id: "ttt_first_win",
    title: "First Blood",
    description: "Win your first Tic-Tac-Toe match in any game mode",
    icon: "Swords",
    game: "tictactoe",
    tier: "bronze",
    type: "milestone",
    xpReward: 50,
    coinReward: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_wins_5",
    title: "Grid Master",
    description: "Win 5 total Tic-Tac-Toe matches",
    icon: "Grid",
    game: "tictactoe",
    tier: "silver",
    type: "milestone",
    xpReward: 100,
    coinReward: 250,
    progress: 0,
    maxProgress: 5,
    unlocked: false,
  },
  {
    id: "ttt_wins_15",
    title: "Tic-Tac-Titan",
    description: "Win 15 total Tic-Tac-Toe matches across career",
    icon: "Crown",
    game: "tictactoe",
    tier: "gold",
    type: "milestone",
    xpReward: 200,
    coinReward: 500,
    progress: 0,
    maxProgress: 15,
    unlocked: false,
  },
  {
    id: "ttt_streak_3",
    title: "On Fire",
    description: "Achieve a 3-game winning streak in Tic-Tac-Toe",
    icon: "Flame",
    game: "tictactoe",
    tier: "bronze",
    type: "skill",
    xpReward: 80,
    coinReward: 200,
    progress: 0,
    maxProgress: 3,
    unlocked: false,
  },
  {
    id: "ttt_streak_5",
    title: "Dominating",
    description: "Achieve an unstoppable 5-game winning streak in Tic-Tac-Toe",
    icon: "Zap",
    game: "tictactoe",
    tier: "gold",
    type: "skill",
    xpReward: 250,
    coinReward: 600,
    progress: 0,
    maxProgress: 5,
    unlocked: false,
  },
  {
    id: "ttt_fast_win",
    title: "Blitz Tactician",
    description: "Win a match in 5 total moves (3 player turns)",
    icon: "Timer",
    game: "tictactoe",
    tier: "silver",
    type: "skill",
    xpReward: 120,
    coinReward: 300,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_diagonal_win",
    title: "Corner King",
    description: "Win a match along a corner-to-corner diagonal line",
    icon: "Sparkles",
    game: "tictactoe",
    tier: "bronze",
    type: "skill",
    xpReward: 70,
    coinReward: 150,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_beat_hard_ai",
    title: "Silicon Slayer",
    description: "Defeat the Minimax AI on Hard difficulty",
    icon: "Bot",
    game: "tictactoe",
    tier: "gold",
    type: "skill",
    xpReward: 250,
    coinReward: 600,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_draw_hard_ai",
    title: "Iron Fortress",
    description: "Hold the line and force a strategic draw against Hard AI",
    icon: "Shield",
    game: "tictactoe",
    tier: "silver",
    type: "skill",
    xpReward: 90,
    coinReward: 200,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_online_win",
    title: "Global Challenger",
    description: "Win a live match in an Online Room or Quick Match",
    icon: "Globe",
    game: "tictactoe",
    tier: "silver",
    type: "exploration",
    xpReward: 150,
    coinReward: 350,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "ttt_win_as_o",
    title: "Second Strike",
    description: "Win a match while playing second as 'O'",
    icon: "CircleDot",
    game: "tictactoe",
    tier: "bronze",
    type: "exploration",
    xpReward: 90,
    coinReward: 220,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },

  // ==================== ARCHERY ACHIEVEMENTS ====================
  {
    id: "arch_first_match",
    title: "Bow Novice",
    description: "Complete your first 3-round Archery match",
    icon: "Target",
    game: "archery",
    tier: "bronze",
    type: "milestone",
    xpReward: 50,
    coinReward: 100,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_played_5",
    title: "Range Veteran",
    description: "Complete 5 full Archery matches",
    icon: "Medal",
    game: "archery",
    tier: "silver",
    type: "milestone",
    xpReward: 100,
    coinReward: 250,
    progress: 0,
    maxProgress: 5,
    unlocked: false,
  },
  {
    id: "arch_bullseye_first",
    title: "Dead Eye",
    description: "Land your first perfect 10-point Bullseye",
    icon: "Crosshair",
    game: "archery",
    tier: "bronze",
    type: "skill",
    xpReward: 80,
    coinReward: 200,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_bullseye_3",
    title: "Bullseye Hattrick",
    description: "Land 3 Bullseyes in a single Archery match",
    icon: "Flame",
    game: "archery",
    tier: "silver",
    type: "skill",
    xpReward: 150,
    coinReward: 350,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_score_50",
    title: "Marksman",
    description: "Score 50 or more points in a single 3-round match",
    icon: "Award",
    game: "archery",
    tier: "bronze",
    type: "milestone",
    xpReward: 90,
    coinReward: 200,
    progress: 0,
    maxProgress: 50,
    unlocked: false,
  },
  {
    id: "arch_score_70",
    title: "Robin Hood",
    description: "Score 70 or more points in a single 3-round match",
    icon: "Trophy",
    game: "archery",
    tier: "silver",
    type: "milestone",
    xpReward: 180,
    coinReward: 400,
    progress: 0,
    maxProgress: 70,
    unlocked: false,
  },
  {
    id: "arch_score_82",
    title: "Mythic Archer",
    description: "Score 82 or higher out of 90 in a single match",
    icon: "Crown",
    game: "archery",
    tier: "platinum",
    type: "milestone",
    xpReward: 300,
    coinReward: 750,
    progress: 0,
    maxProgress: 82,
    unlocked: false,
  },
  {
    id: "arch_high_wind_hit",
    title: "Storm Weaver",
    description: "Hit a 9 or 10 score when wind speed exceeds 2.5 m/s",
    icon: "Wind",
    game: "archery",
    tier: "gold",
    type: "skill",
    xpReward: 200,
    coinReward: 500,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_long_range_10",
    title: "Long Range Maestro",
    description: "Hit a 10 at maximum 70m distance (Round 3)",
    icon: "Compass",
    game: "archery",
    tier: "gold",
    type: "skill",
    xpReward: 200,
    coinReward: 500,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_perfect_round",
    title: "Golden Round",
    description: "Score a perfect 30/30 (all 10s) in any single round",
    icon: "Sparkles",
    game: "archery",
    tier: "diamond",
    type: "skill",
    xpReward: 350,
    coinReward: 1000,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arch_bullseyes_10",
    title: "Bullseye Collector",
    description: "Accumulate 10 total career Bullseyes",
    icon: "Target",
    game: "archery",
    tier: "silver",
    type: "exploration",
    xpReward: 150,
    coinReward: 350,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
  },

  // ==================== ARENA GENERAL ACHIEVEMENTS ====================
  {
    id: "arena_friend_room",
    title: "Honor Duel",
    description: "Create or join a private room to challenge a friend",
    icon: "Users",
    game: "general",
    tier: "bronze",
    type: "exploration",
    xpReward: 100,
    coinReward: 250,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "arena_both_games",
    title: "Dual Champion",
    description: "Play at least 3 matches in both Tic-Tac-Toe and Archery",
    icon: "Gamepad2",
    game: "general",
    tier: "silver",
    type: "exploration",
    xpReward: 150,
    coinReward: 350,
    progress: 0,
    maxProgress: 3,
    unlocked: false,
  },
];

const ACHIEVEMENTS_STORAGE_KEY = "tg_arena_achievements_v2";

type UnlockListener = (achievement: Achievement) => void;

class AchievementManager {
  private achievements: Record<string, Achievement> = {};
  private listeners: UnlockListener[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    // Initialize defaults
    const map: Record<string, Achievement> = {};
    MASTER_ACHIEVEMENTS.forEach((a) => {
      map[a.id] = { ...a };
    });

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach((id) => {
            if (map[id]) {
              map[id].unlocked = parsed[id].unlocked;
              map[id].progress = parsed[id].progress;
              map[id].unlockedAt = parsed[id].unlockedAt;
            }
          });
        } catch {
          // ignore
        }
      }
    }

    this.achievements = map;
  }

  private saveState() {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(this.achievements));
  }

  public subscribe(listener: UnlockListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyUnlocked(ach: Achievement) {
    soundManager.playAchievement();
    triggerHaptic("success");

    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.2 },
    });

    this.listeners.forEach((l) => l(ach));
  }

  public unlock(id: string): boolean {
    const ach = this.achievements[id];
    if (!ach || ach.unlocked) return false;

    ach.unlocked = true;
    ach.progress = ach.maxProgress;
    ach.unlockedAt = Date.now();
    this.saveState();

    // Reward player XP & Coins in their profile
    const profile = getOrCreatePlayerProfile();
    profile.xp += ach.xpReward;
    profile.coins += ach.coinReward;
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
    }
    savePlayerProfile(profile);

    this.notifyUnlocked(ach);
    return true;
  }

  public updateProgress(id: string, currentVal: number): boolean {
    const ach = this.achievements[id];
    if (!ach || ach.unlocked) return false;

    ach.progress = Math.min(ach.maxProgress, currentVal);
    if (ach.progress >= ach.maxProgress) {
      return this.unlock(id);
    } else {
      this.saveState();
      return false;
    }
  }

  public getAll(): Achievement[] {
    return Object.values(this.achievements);
  }

  public getByGame(game: GameType | "general"): Achievement[] {
    return Object.values(this.achievements).filter((a) => a.game === game);
  }

  public getUnlockedCount(): number {
    return Object.values(this.achievements).filter((a) => a.unlocked).length;
  }

  // ==================== EVENT TRACKERS ====================

  /**
   * Called when a Tic-Tac-Toe match concludes
   */
  public recordTicTacToeGame(params: {
    isWin: boolean;
    isLoss: boolean;
    isDraw: boolean;
    movesCount: number;
    winningLine: number[] | null;
    symbol: "X" | "O";
    mode: string;
    difficulty: string;
    currentStreak: number;
    totalWins: number;
    totalPlayed: number;
  }) {
    const {
      isWin,
      isDraw,
      movesCount,
      winningLine,
      symbol,
      mode,
      difficulty,
      currentStreak,
      totalWins,
      totalPlayed,
    } = params;

    // Milestones
    if (isWin) {
      this.unlock("ttt_first_win");
      this.updateProgress("ttt_wins_5", totalWins);
      this.updateProgress("ttt_wins_15", totalWins);
    }

    // Streaks
    if (currentStreak >= 3) {
      this.updateProgress("ttt_streak_3", currentStreak);
    }
    if (currentStreak >= 5) {
      this.updateProgress("ttt_streak_5", currentStreak);
    }

    // Fast win (5 moves total)
    if (isWin && movesCount <= 5) {
      this.unlock("ttt_fast_win");
    }

    // Diagonal win: winningLine [0, 4, 8] or [2, 4, 6]
    if (isWin && winningLine) {
      const isDiagonal =
        (winningLine.includes(0) && winningLine.includes(4) && winningLine.includes(8)) ||
        (winningLine.includes(2) && winningLine.includes(4) && winningLine.includes(6));
      if (isDiagonal) {
        this.unlock("ttt_diagonal_win");
      }
    }

    // Against Hard AI
    if (mode === "single_ai" && difficulty === "hard") {
      if (isWin) {
        this.unlock("ttt_beat_hard_ai");
      } else if (isDraw) {
        this.unlock("ttt_draw_hard_ai");
      }
    }

    // Online Win
    if (isWin && (mode === "online_room" || mode === "quick_match")) {
      this.unlock("ttt_online_win");
    }

    // Win as O (Second player)
    if (isWin && symbol === "O") {
      this.unlock("ttt_win_as_o");
    }

    // Dual Champion check
    const profile = getOrCreatePlayerProfile();
    const archPlayed = profile.stats.archery.played;
    if (totalPlayed >= 3 && archPlayed >= 3) {
      this.unlock("arena_both_games");
    } else {
      this.updateProgress("arena_both_games", Math.min(totalPlayed, archPlayed));
    }
  }

  /**
   * Called whenever an arrow lands in Archery
   */
  public recordArcheryShot(params: {
    score: number;
    isBullseye: boolean;
    wind: number;
    distance: number;
    round: number;
    shotNumber: number;
  }) {
    const { score, isBullseye, wind, distance } = params;

    // First Bullseye
    if (isBullseye || score === 10) {
      this.unlock("arch_bullseye_first");
    }

    // High Wind Hit (wind >= 2.5 m/s and score is 9 or 10)
    if (Math.abs(wind) >= 2.5 && score >= 9) {
      this.unlock("arch_high_wind_hit");
    }

    // Long distance 10 (at 70m distance)
    if (distance >= 70 && score === 10) {
      this.unlock("arch_long_range_10");
    }
  }

  /**
   * Called when an Archery game is completed (all 3 rounds finished)
   */
  public recordArcheryGame(params: {
    finalScore: number;
    bullseyesCount: number;
    roundScores: number[];
    totalPlayed: number;
    careerBullseyes: number;
  }) {
    const { finalScore, bullseyesCount, roundScores, totalPlayed, careerBullseyes } = params;

    // Novice & Veteran
    this.unlock("arch_first_match");
    this.updateProgress("arch_played_5", totalPlayed);

    // Bullseye Hattrick (3 bullseyes in single match)
    if (bullseyesCount >= 3) {
      this.unlock("arch_bullseye_3");
    }

    // Score Milestones
    if (finalScore >= 50) {
      this.updateProgress("arch_score_50", finalScore);
    }
    if (finalScore >= 70) {
      this.updateProgress("arch_score_70", finalScore);
    }
    if (finalScore >= 82) {
      this.updateProgress("arch_score_82", finalScore);
    }

    // Perfect round (30/30 in any round)
    if (roundScores.some((rs) => rs === 30)) {
      this.unlock("arch_perfect_round");
    }

    // Career Bullseyes
    this.updateProgress("arch_bullseyes_10", careerBullseyes);

    // Dual Champion check
    const profile = getOrCreatePlayerProfile();
    const tttPlayed = profile.stats.tictactoe.played;
    if (totalPlayed >= 3 && tttPlayed >= 3) {
      this.unlock("arena_both_games");
    } else {
      this.updateProgress("arena_both_games", Math.min(totalPlayed, tttPlayed));
    }
  }

  /**
   * Called when a player joins or creates a private multiplayer room
   */
  public recordFriendRoom() {
    this.unlock("arena_friend_room");
  }
}

export const achievementManager = new AchievementManager();
export const ALL_ACHIEVEMENTS = MASTER_ACHIEVEMENTS;
