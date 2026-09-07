import React from "react";
import { Volume2, VolumeX, Zap, Trophy, Coins } from "lucide-react";
import { PlayerProfile } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";

interface Props {
  profile: PlayerProfile;
  onOpenProfile: () => void;
  onlineStatus: "connecting" | "connected" | "disconnected";
  soundOn: boolean;
  onToggleSound: () => void;
}

export const TelegramHeader: React.FC<Props> = ({
  profile,
  onOpenProfile,
  onlineStatus,
  soundOn,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0E1117]/80 backdrop-blur-md border-b border-white/5 px-5 py-3.5 flex items-center justify-between">
      {/* Player Profile Quick Info */}
      <button
        onClick={() => {
          soundManager.playClick();
          triggerHaptic("selection");
          onOpenProfile();
        }}
        className="flex items-center gap-3 text-left group transition active:scale-95"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full rounded-full bg-[#0E1117] flex items-center justify-center text-lg">
              {profile.avatar}
            </div>
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-0.5 -right-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-[9px] font-black text-white shadow">
            Lv.{profile.level}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Commander
            </p>
            {/* Server Online Status Dot */}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                onlineStatus === "connected"
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                  : onlineStatus === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-rose-500"
              }`}
              title={`Server: ${onlineStatus}`}
            />
          </div>
          <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition truncate max-w-[120px] leading-tight">
            {profile.name}
          </p>
        </div>
      </button>

      {/* Right Stats & Controls */}
      <div className="flex items-center gap-2">
        {/* Coins Pill - Immersive UI pill style */}
        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-xs font-mono font-bold tracking-tight text-white">
            {profile.coins.toLocaleString()}
          </span>
        </div>

        {/* ELO Rating Badge */}
        <div className="hidden sm:flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-300 text-xs font-bold font-mono">
          <Trophy className="w-3 h-3 text-indigo-400" />
          <span>{profile.rating}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95"
          title="Toggle Sound"
        >
          {soundOn ? (
            <Volume2 className="w-4 h-4 text-indigo-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
    </header>
  );
};
