import React, { useState } from "react";
import { Play, Users, Bot, Globe, Target, Trophy, Flame, Gift, Sparkles, ChevronRight, Zap, ShieldAlert } from "lucide-react";
import confetti from "canvas-confetti";
import { GameType, GameMode, PlayerProfile } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";
import { savePlayerProfile } from "../services/storage";

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onLaunchTicTacToe: (mode: GameMode) => void;
  onLaunchArchery: () => void;
  onOpenMultiplayer: (gameType: GameType, title: string) => void;
}

export const Lobby: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onLaunchTicTacToe,
  onLaunchArchery,
  onOpenMultiplayer,
}) => {
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false);

  const handleClaimDaily = () => {
    if (hasClaimedDaily) return;
    soundManager.playWin();
    triggerHaptic("success");
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.4 },
    });

    const updated = {
      ...profile,
      coins: profile.coins + 150,
      xp: profile.xp + 50,
    };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    setHasClaimedDaily(true);
  };

  return (
    <div className="w-full flex flex-col px-5 py-4 pb-24 select-none">
      {/* Immersive Hot Event Tournament Banner */}
      <div className="relative w-full h-36 rounded-3xl overflow-hidden bg-indigo-600/20 border border-indigo-500/30 mb-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 via-indigo-900/20 to-transparent p-4 sm:p-5 flex flex-col justify-between z-10">
          <div>
            <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
              Hot Event
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
              Summer Archery<br />Open Tournament
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("medium");
                onLaunchArchery();
              }}
              className="bg-white hover:bg-indigo-50 text-indigo-950 text-xs font-bold px-4 py-1.5 rounded-lg shadow transition active:scale-95"
            >
              Join Now
            </button>
            <span className="text-[10px] text-indigo-200 font-medium">Ends in 2h 14m</span>
          </div>
        </div>
        {/* Decorative Background Target SVG */}
        <div className="absolute right-[-20px] top-[-10px] opacity-30 scale-125 pointer-events-none">
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold tracking-wide uppercase text-gray-400">Game Lobby</h4>
        <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>2,841 Online</span>
        </span>
      </div>

      {/* Game Cards Stack */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GAME 1: Tic-Tac-Toe */}
        <div className="bg-white/5 border border-white/10 rounded-[28px] p-4 flex flex-col gap-3 group hover:border-indigo-500/30 transition shadow-lg">
          {/* Visual Preview Box */}
          <div className="w-full h-32 bg-[#1C1F26] rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
            {/* 3x3 Grid Graphic from design */}
            <div className="grid grid-cols-3 gap-1.5 w-16 h-16 relative z-10">
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
              <div className="border border-white/20 rounded-md text-xs font-black flex items-center justify-center text-indigo-400">X</div>
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
              <div className="border border-white/20 rounded-md text-xs font-black flex items-center justify-center text-purple-400">O</div>
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
              <div className="border border-white/20 rounded-md text-xs font-black flex items-center justify-center text-indigo-400">X</div>
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
              <div className="border border-white/20 rounded-md flex items-center justify-center"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Tic-Tac-Toe</p>
              <p className="text-[10px] text-gray-400">PvP • Smart AI • Rooms</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {profile.stats.tictactoe.won}W
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("medium");
                onLaunchTicTacToe("single_ai");
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/20"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Play vs AI</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("medium");
                onOpenMultiplayer("tictactoe", "Tic-Tac-Toe");
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Multiplayer</span>
            </button>
          </div>
        </div>

        {/* GAME 2: Archery 2D */}
        <div className="bg-white/5 border border-white/10 rounded-[28px] p-4 flex flex-col gap-3 group hover:border-emerald-500/30 transition shadow-lg">
          {/* Visual Preview Box */}
          <div className="w-full h-32 bg-[#1C1F26] rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20"></div>
            {/* Archery Arrow Graphic from design */}
            <div className="relative transform -rotate-45 z-10">
              <div className="w-20 h-0.5 bg-gray-300 rounded-full shadow"></div>
              <div className="absolute right-0 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-500"></div>
              <div className="absolute left-0 -top-0.5 w-3 h-1.5 bg-emerald-400/80 rounded-sm"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Archery 2D</p>
              <p className="text-[10px] text-gray-400">Precision • Crosswind • Solo</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              High: {profile.stats.archery.highScore}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("medium");
                onLaunchArchery();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Range</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("medium");
                onOpenMultiplayer("archery", "Archery Range");
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Duel Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Immersive Active Quest / Daily Quest Block */}
      <div className="mt-5">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-sm shadow-md shadow-indigo-500/30">
            🏆
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
              Active Daily Quest
            </p>
            <p className="text-xs font-semibold text-white">
              Hit a Bullseye or win 1 match today
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={handleClaimDaily}
              disabled={hasClaimedDaily}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition active:scale-95 ${
                hasClaimedDaily
                  ? "bg-white/5 text-gray-500 border border-white/5"
                  : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20"
              }`}
            >
              {hasClaimedDaily ? "Completed" : "+150 Coins"}
            </button>
          </div>
        </div>
      </div>

      {/* Platform Features Notice */}
      <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Zero-Lag Canvas 2D Engine • Optimized for Mobile</span>
        </div>
        <span className="font-mono text-[10px] text-indigo-400 font-bold">60 FPS</span>
      </div>
    </div>
  );
};
