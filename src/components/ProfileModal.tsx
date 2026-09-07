import React, { useState } from "react";
import {
  Trophy,
  Award,
  History,
  Edit2,
  Check,
  Sparkles,
  Shield,
  Coins,
  ChevronRight,
  Filter,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { PlayerProfile, Achievement, GameType, AchievementType } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";
import { savePlayerProfile, getMatchHistory } from "../services/storage";
import { achievementManager } from "../services/achievements";
import { AchievementBadge, TIER_CONFIG } from "./AchievementBadge";
import { AchievementDetailModal } from "./AchievementDetailModal";

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
}

export const ProfileModal: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements" | "history">("stats");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Achievement filtering & detail modal state
  const [gameFilter, setGameFilter] = useState<GameType | "general" | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AchievementType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [inspectAchievement, setInspectAchievement] = useState<Achievement | null>(null);

  const history = getMatchHistory();
  const allAchievements = achievementManager.getAll();
  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const totalCount = allAchievements.length;
  const unlockPercent = Math.round((unlockedCount / totalCount) * 100);

  // Showcase badges (highest unlocked tiers: diamond -> platinum -> gold -> silver -> bronze)
  const tierWeight: Record<string, number> = {
    diamond: 5,
    platinum: 4,
    gold: 3,
    silver: 2,
    bronze: 1,
  };
  const showcaseBadges = allAchievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (tierWeight[b.tier] || 0) - (tierWeight[a.tier] || 0))
    .slice(0, 4);

  const AVATARS = [
    "🦊", "🦁", "🐼", "🐯", "🦅", "🐺", "⚡", "🚀",
    "🎯", "👑", "⚔️", "🥷", "🧙", "🐉", "🤖", "🏹",
  ];

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const updated = { ...profile, name: nameInput.trim() };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    setIsEditingName(false);
    triggerHaptic("success");
    soundManager.playClick();
  };

  const handleSelectAvatar = (avatar: string) => {
    const updated = { ...profile, avatar };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    setIsPickerOpen(false);
    triggerHaptic("selection");
    soundManager.playClick();
  };

  // Compute stats
  const tt = profile.stats.tictactoe;
  const ttWinRate = tt.played > 0 ? Math.round((tt.won / tt.played) * 100) : 0;
  const arch = profile.stats.archery;

  // Level XP progress (250 XP per level)
  const currentLevelBaseXP = (profile.level - 1) * 250;
  const currentLevelProgressXP = profile.xp - currentLevelBaseXP;
  const xpNeededForNextLevel = 250;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentLevelProgressXP / xpNeededForNextLevel) * 100)
  );

  // Filtered achievements
  const filteredAchievements = allAchievements.filter((ach) => {
    if (gameFilter !== "all" && ach.game !== gameFilter) return false;
    if (typeFilter !== "all" && ach.type !== typeFilter) return false;
    if (statusFilter === "unlocked" && !ach.unlocked) return false;
    if (statusFilter === "locked" && ach.unlocked) return false;
    return true;
  });

  return (
    <div className="w-full flex flex-col px-5 py-4 pb-24 select-none">
      {/* Profile Identity Card */}
      <div className="p-4 rounded-[28px] bg-white/5 border border-white/10 shadow-xl mb-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          {/* Avatar with edit button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsPickerOpen(!isPickerOpen);
                soundManager.playClick();
              }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition"
            >
              <div className="w-full h-full bg-[#0E1117] rounded-[14px] flex items-center justify-center text-3xl">
                {profile.avatar}
              </div>
            </button>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow">
              Lv.{profile.level}
            </div>
          </div>

          {/* Name & Title */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={16}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="py-1 px-2.5 bg-[#1C1F26] border border-indigo-500 rounded-xl text-xs font-bold text-white focus:outline-none w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-[170px]">
                  {profile.name}
                </h2>
                <button
                  onClick={() => {
                    setNameInput(profile.name);
                    setIsEditingName(true);
                  }}
                  className="text-gray-400 hover:text-indigo-400 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-1 border border-indigo-500/20">
                <Trophy className="w-3 h-3 text-indigo-400" />
                {profile.rating} Rating
              </span>
              <span className="text-xs text-amber-300 font-mono flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {profile.coins}
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5 font-medium">
            <span>Level {profile.level}</span>
            <span>
              {currentLevelProgressXP} / {xpNeededForNextLevel} XP
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1C1F26] overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Showcase Badges Section */}
        <div className="mt-3.5 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-indigo-400" />
              <span>Showcase Badges</span>
            </span>
            <button
              onClick={() => {
                setActiveTab("achievements");
                soundManager.playClick();
              }}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              <span>{unlockedCount}/{totalCount} Unlocked</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {showcaseBadges.length > 0 ? (
              showcaseBadges.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => {
                    setInspectAchievement(badge);
                    soundManager.playClick();
                  }}
                  className="cursor-pointer"
                >
                  <AchievementBadge achievement={badge} size="sm" />
                </div>
              ))
            ) : (
              <div className="col-span-4 p-2.5 rounded-xl bg-white/5 border border-white/5 text-center text-[11px] text-gray-500">
                Play games to unlock and showcase your badges!
              </div>
            )}
          </div>
        </div>

        {/* Avatar Picker Dropdown */}
        {isPickerOpen && (
          <div className="mt-3 p-3 bg-[#1C1F26] rounded-2xl border border-white/10 animate-in fade-in duration-150">
            <span className="text-xs text-gray-400 font-medium block mb-2">Choose Avatar:</span>
            <div className="grid grid-cols-8 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => handleSelectAvatar(av)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition active:scale-90 ${
                    profile.avatar === av
                      ? "bg-indigo-600 shadow"
                      : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 mb-4">
        {[
          { id: "stats" as const, label: "Stats", icon: Shield },
          { id: "achievements" as const, label: `Badges (${unlockedCount})`, icon: Award },
          { id: "history" as const, label: "History", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("selection");
                setActiveTab(tab.id);
              }}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Statistics */}
      {activeTab === "stats" && (
        <div className="flex flex-col gap-3">
          {/* Tic-Tac-Toe Stats Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span>❌</span>
                <span>Tic-Tac-Toe Record</span>
              </span>
              <span className="text-xs font-medium text-gray-400">{ttWinRate}% Win Rate</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Wins</span>
                <div className="text-lg font-black text-emerald-400 font-mono">{tt.won}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Losses</span>
                <div className="text-lg font-black text-rose-400 font-mono">{tt.lost}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Best Streak</span>
                <div className="text-lg font-black text-amber-400 font-mono">{tt.bestStreak} 🔥</div>
              </div>
            </div>
          </div>

          {/* Archery Stats Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Archery Record</span>
              </span>
              <span className="text-xs font-medium text-gray-400">{arch.avgAccuracy}% Accuracy</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">High Score</span>
                <div className="text-lg font-black text-amber-400 font-mono">{arch.highScore}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Bullseyes</span>
                <div className="text-lg font-black text-rose-400 font-mono">{arch.bullseyes}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1C1F26] border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Matches</span>
                <div className="text-lg font-black text-white font-mono">{arch.played}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Achievements Gallery & Badges */}
      {activeTab === "achievements" && (
        <div className="flex flex-col gap-3">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-[26px] bg-white/5 border border-white/10 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Badge Collection
                </h3>
                <span className="text-[11px] text-gray-400">
                  {unlockedCount} of {totalCount} badges unlocked
                </span>
              </div>
              <span className="text-base font-black text-indigo-400 font-mono">
                {unlockPercent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#1C1F26] overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${unlockPercent}%` }}
              />
            </div>
          </div>

          {/* Game Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "all", label: "All (24)" },
              { id: "tictactoe", label: "Tic-Tac-Toe (11)" },
              { id: "archery", label: "Archery (11)" },
              { id: "general", label: "Arena (2)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setGameFilter(f.id as any);
                  soundManager.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                  gameFilter === f.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Type Filters: All, Milestones, Skill, Exploration */}
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "All Types" },
              { id: "milestone", label: "Milestones" },
              { id: "skill", label: "Skillful" },
              { id: "exploration", label: "Exploration" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTypeFilter(t.id as any);
                  soundManager.playClick();
                }}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold text-center transition ${
                  typeFilter === t.id
                    ? "bg-white/15 text-white border border-white/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Achievement List */}
          <div className="flex flex-col gap-2.5 mt-1">
            {filteredAchievements.map((ach) => {
              const config = TIER_CONFIG[ach.tier];
              const progressPct = Math.min(
                100,
                Math.round((ach.progress / ach.maxProgress) * 100)
              );

              return (
                <div
                  key={ach.id}
                  onClick={() => {
                    setInspectAchievement(ach);
                    soundManager.playClick();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden flex items-center justify-between gap-3 ${
                    ach.unlocked
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-[#11141D]/60 border-white/5 opacity-70 hover:opacity-85"
                  }`}
                >
                  {/* Left: Badge Emblem */}
                  <div className="flex items-center gap-3">
                    <AchievementBadge achievement={ach} size="md" />

                    {/* Middle: Title, Type & Description */}
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white leading-tight">
                          {ach.title}
                        </span>
                        {ach.unlocked && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                            UNLOCKED
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {ach.description}
                      </p>

                      {/* Progress Bar for Locked */}
                      {!ach.unlocked && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-24 h-1.5 rounded-full bg-[#1C1F26] overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-gray-500">
                            {ach.progress}/{ach.maxProgress}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Reward */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[11px] font-bold text-indigo-300 font-mono">
                      +{ach.xpReward} XP
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 font-mono flex items-center gap-0.5">
                      +{ach.coinReward}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Match History */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No games played yet. Jump into the lobby to play!
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                    {item.gameType === "tictactoe" ? "❌" : "🎯"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">{item.gameName}</span>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                      vs {item.opponent} •{" "}
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold uppercase ${
                      item.result === "win"
                        ? "text-emerald-400"
                        : item.result === "loss"
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {item.result}
                  </span>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {item.scoreText}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Inspect Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={inspectAchievement}
        onClose={() => setInspectAchievement(null)}
      />
    </div>
  );
};
