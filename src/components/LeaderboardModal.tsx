import React, { useState, useEffect } from "react";
import { Trophy, Medal, Flame, RefreshCw, ChevronRight } from "lucide-react";
import { LeaderboardUser, PlayerProfile } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";

interface Props {
  profile: PlayerProfile;
}

export const LeaderboardModal: React.FC<Props> = ({ profile }) => {
  const [selectedGame, setSelectedGame] = useState<"all" | "tictactoe" | "archery">("all");
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboards?game=${selectedGame}`);
      const data = await res.json();
      if (data.entries) {
        // Include current user in list
        const list: LeaderboardUser[] = data.entries.map((item: any) => ({
          ...item,
          isCurrentUser: item.id === profile.id,
        }));

        // If current user is not in the list, append them with their real score
        const userInList = list.some((u) => u.isCurrentUser);
        if (!userInList) {
          const userScore =
            selectedGame === "tictactoe"
              ? profile.stats.tictactoe.won * 100
              : selectedGame === "archery"
              ? profile.stats.archery.highScore * 10
              : profile.rating;

          list.push({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            score: Math.max(userScore, profile.rating),
            wins: profile.stats.tictactoe.won + profile.stats.archery.bullseyes,
            game: selectedGame,
            rankTitle: profile.level > 3 ? "Diamond" : profile.level > 1 ? "Gold" : "Contender",
            isCurrentUser: true,
          });
          list.sort((a, b) => b.score - a.score);
        }

        setLeaders(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedGame]);

  return (
    <div className="w-full flex flex-col px-5 py-4 pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Arena Rankings</span>
            <Trophy className="w-4 h-4 text-indigo-400" />
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Top players across the platform</p>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            triggerHaptic("selection");
            fetchLeaderboards();
          }}
          disabled={isLoading}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* Game Filters */}
      <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 mb-4">
        {[
          { id: "all" as const, label: "Overall Rating" },
          { id: "tictactoe" as const, label: "Tic-Tac-Toe" },
          { id: "archery" as const, label: "Archery" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              triggerHaptic("selection");
              setSelectedGame(tab.id);
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition ${
              selectedGame === tab.id
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current User Quick Rank Card */}
      <div className="p-3.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-between mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1C1F26] border border-indigo-500/30 flex items-center justify-center text-xl shadow">
            {profile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{profile.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase">
                YOU
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Level {profile.level} • {profile.coins} Coins
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-black text-indigo-400 font-mono">{profile.rating} PTS</div>
          <span className="text-[10px] text-gray-400">
            Rank #{leaders.findIndex((l) => l.isCurrentUser) + 1 || 1}
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex flex-col gap-2">
        {leaders.map((user, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          return (
            <div
              key={user.id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                user.isCurrentUser
                  ? "bg-indigo-500/15 border-indigo-500/40 shadow-sm"
                  : isTop3
                  ? "bg-white/5 border-white/10"
                  : "bg-white/[0.02] border-white/5"
              }`}
            >
              {/* Rank Position + User */}
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs font-mono ${
                    rank === 1
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30"
                      : rank === 2
                      ? "bg-slate-300 text-slate-950 shadow-md shadow-slate-300/20"
                      : rank === 3
                      ? "bg-amber-700 text-amber-100"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {rank}
                </div>

                <div className="text-xl">{user.avatar}</div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        user.isCurrentUser ? "text-indigo-400" : "text-white"
                      }`}
                    >
                      {user.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{user.rankTitle}</span>
                </div>
              </div>

              {/* Score / Wins */}
              <div className="text-right">
                <span className="text-xs font-black text-white font-mono">
                  {user.score.toLocaleString()}
                </span>
                <div className="text-[10px] text-gray-500 font-mono">{user.wins} Wins</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
