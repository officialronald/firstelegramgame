import React from "react";
import { X, Trophy, Coins, Sparkles, Calendar, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Achievement } from "../types";
import { AchievementBadge, TIER_CONFIG } from "./AchievementBadge";

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementDetailModal: React.FC<Props> = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const { title, description, tier, game, type, xpReward, coinReward, unlocked, progress, maxProgress, unlockedAt } = achievement;
  const config = TIER_CONFIG[tier];
  const progressPercent = Math.min(100, Math.round((progress / maxProgress) * 100));

  const gameNames = {
    tictactoe: "Tic-Tac-Toe",
    archery: "2D Archery",
    general: "Arena Platform",
  };

  const typeLabels = {
    milestone: "Milestone",
    skill: "Skillful Play",
    exploration: "Exploration",
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05060A]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0E1117] border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
        {/* Background ambient tier glow */}
        <div
          className={`absolute -top-16 -right-16 w-44 h-44 rounded-full ${config.glow} blur-3xl pointer-events-none`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center Badge Display */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <AchievementBadge achievement={achievement} size="lg" />
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeBg}`}
            >
              {config.name} Badge
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">
              {typeLabels[type]}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
          <span className="text-xs text-indigo-400 font-medium">
            {gameNames[game]}
          </span>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 leading-relaxed text-center mb-4">
          {description}
        </div>

        {/* Rewards Section */}
        <div className="grid grid-cols-2 gap-2 bg-[#1C1F26] p-3 rounded-2xl border border-white/5 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">XP Reward</span>
              <span className="text-xs font-black text-indigo-300 font-mono">+{xpReward} XP</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Coin Reward</span>
              <span className="text-xs font-black text-amber-300 font-mono">+{coinReward} Coins</span>
            </div>
          </div>
        </div>

        {/* Progress / Unlock Status */}
        {unlocked ? (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-emerald-400 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Achievement Unlocked!</span>
            </div>
            {unlockedAt && (
              <span className="text-[11px] font-mono text-emerald-300/80 font-normal">
                {new Date(unlockedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Progress</span>
              </span>
              <span className="font-mono text-gray-300 font-bold">
                {progress} / {maxProgress} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1C1F26] overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Close action */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition active:scale-95 border border-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
};
