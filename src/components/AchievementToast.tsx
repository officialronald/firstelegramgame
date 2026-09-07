import React, { useEffect, useState } from "react";
import { Sparkles, Coins, Trophy, X } from "lucide-react";
import { Achievement } from "../types";
import { achievementManager } from "../services/achievements";
import { AchievementBadge } from "./AchievementBadge";

export const AchievementToast: React.FC = () => {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = achievementManager.subscribe((achievement) => {
      setCurrent(achievement);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 4500);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  if (!current || !visible) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="w-full max-w-sm bg-[#0E1117]/95 border border-amber-400/40 backdrop-blur-xl rounded-[26px] p-3.5 shadow-[0_10px_35px_rgba(234,179,8,0.25)] flex items-center justify-between gap-3 pointer-events-auto relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3">
          <AchievementBadge achievement={current} size="sm" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Achievement Unlocked!
              </span>
            </div>
            <h4 className="text-xs font-bold text-white leading-tight mt-0.5">
              {current.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
              <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> +{current.xpReward} XP
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Coins className="w-2.5 h-2.5" /> +{current.coinReward}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition active:scale-95 border border-white/5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
