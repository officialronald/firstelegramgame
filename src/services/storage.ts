import { PlayerProfile, MatchHistoryItem, Achievement } from "../types";
import { getTelegramUserData } from "./telegram";
import { ALL_ACHIEVEMENTS } from "./achievements";

const PROFILE_KEY = "tg_arena_player_profile";
const HISTORY_KEY = "tg_arena_match_history";

export const INITIAL_ACHIEVEMENTS: Achievement[] = ALL_ACHIEVEMENTS;

export function getOrCreatePlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") {
    return createDefaultProfile();
  }

  const tgUser = getTelegramUserData();
  const saved = localStorage.getItem(PROFILE_KEY);

  if (saved) {
    try {
      const parsed: PlayerProfile = JSON.parse(saved);
      // Sync telegram user details if available and not yet set
      if (tgUser && !parsed.name.startsWith(tgUser.first_name || "")) {
        parsed.name = tgUser.username ? `@${tgUser.username}` : tgUser.first_name || parsed.name;
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  const newProfile = createDefaultProfile();
  if (tgUser) {
    newProfile.id = `tg_${tgUser.id}`;
    newProfile.name = tgUser.username ? `@${tgUser.username}` : (tgUser.first_name || "Gamer");
  }
  savePlayerProfile(newProfile);
  return newProfile;
}

function createDefaultProfile(): PlayerProfile {
  const randomId = "user_" + Math.random().toString(36).substring(2, 8);
  const animalAvatars = ["🦊", "🦁", "🐼", "🐯", "🦅", "🐺", "⚡", "🚀", "🎯", "👑"];
  const randomAvatar = animalAvatars[Math.floor(Math.random() * animalAvatars.length)];

  return {
    id: randomId,
    name: "Player_" + randomId.substring(5),
    avatar: randomAvatar,
    coins: 500,
    xp: 0,
    level: 1,
    rating: 1200,
    stats: {
      tictactoe: {
        played: 0,
        won: 0,
        lost: 0,
        draws: 0,
        streak: 0,
        bestStreak: 0,
      },
      archery: {
        played: 0,
        highScore: 0,
        bullseyes: 0,
        totalScore: 0,
        avgAccuracy: 0,
      },
    },
    achievements: [],
  };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  // Recalculate level based on XP (each level requires Level * 200 XP)
  profile.level = Math.max(1, Math.floor(profile.xp / 250) + 1);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  // Async submit to server leaderboard
  fetch("/api/leaderboards/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      scoreDelta: 0,
      won: false,
    }),
  }).catch(() => {});
}

export function addMatchHistory(item: Omit<MatchHistoryItem, "id" | "timestamp">): MatchHistoryItem {
  const newItem: MatchHistoryItem = {
    ...item,
    id: "hist_" + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    const history = getMatchHistory();
    history.unshift(newItem);
    // Keep max 40 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
  }

  return newItem;
}

export function getMatchHistory(): MatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}
