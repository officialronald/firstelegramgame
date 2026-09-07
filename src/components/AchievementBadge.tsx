import React from "react";
import {
  Swords,
  Grid3X3,
  Crown,
  Flame,
  Zap,
  Timer,
  Sparkles,
  Bot,
  Shield,
  Globe,
  CircleDot,
  Target,
  Medal,
  Crosshair,
  Award,
  Trophy,
  Wind,
  Compass,
  Users,
  Gamepad2,
  Lock,
  CheckCircle2,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import { Achievement, AchievementTier } from "../types";

interface Props {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  onClick?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Swords,
  Grid: Grid3X3,
  Crown,
  Flame,
  Zap,
  Timer,
  Sparkles,
  Bot,
  Shield,
  Globe,
  CircleDot,
  Target,
  Medal,
  Crosshair,
  Award,
  Trophy,
  Wind,
  Compass,
  Users,
  Gamepad2,
};

export const TIER_CONFIG: Record<
  AchievementTier,
  {
    name: string;
    border: string;
    bgGradient: string;
    glow: string;
    text: string;
    badgeBg: string;
    accentColor: string;
  }
> = {
  bronze: {
    name: "Bronze",
    border: "border-amber-700/60 shadow-[0_0_15px_rgba(180,83,9,0.2)]",
    bgGradient: "from-amber-950/60 via-[#1C1510] to-[#0E1117]",
    glow: "bg-amber-600/20",
    text: "text-amber-400",
    badgeBg: "bg-amber-900/40 border-amber-700/50 text-amber-300",
    accentColor: "#d97706",
  },
  silver: {
    name: "Silver",
    border: "border-slate-400/60 shadow-[0_0_18px_rgba(148,163,184,0.25)]",
    bgGradient: "from-slate-800/60 via-[#1A202C] to-[#0E1117]",
    glow: "bg-slate-400/20",
    text: "text-slate-200",
    badgeBg: "bg-slate-800/50 border-slate-500/50 text-slate-200",
    accentColor: "#94a3b8",
  },
  gold: {
    name: "Gold",
    border: "border-yellow-400/70 shadow-[0_0_22px_rgba(234,179,8,0.3)]",
    bgGradient: "from-yellow-950/70 via-[#221A08] to-[#0E1117]",
    glow: "bg-yellow-500/25",
    text: "text-yellow-300",
    badgeBg: "bg-yellow-500/20 border-yellow-400/50 text-yellow-300",
    accentColor: "#eab308",
  },
  platinum: {
    name: "Platinum",
    border: "border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.35)]",
    bgGradient: "from-cyan-950/70 via-[#0B2533] to-[#0E1117]",
    glow: "bg-cyan-500/30",
    text: "text-cyan-300",
    badgeBg: "bg-cyan-500/20 border-cyan-400/50 text-cyan-300",
    accentColor: "#06b6d4",
  },
  diamond: {
    name: "Diamond",
    border: "border-purple-400/80 shadow-[0_0_28px_rgba(168,85,247,0.4)]",
    bgGradient: "from-purple-950/80 via-[#271038] to-[#0E1117]",
    glow: "bg-purple-500/30",
    text: "text-purple-300",
    badgeBg: "bg-purple-500/20 border-purple-400/50 text-purple-300",
    accentColor: "#a855f7",
  },
};

export const AchievementBadge: React.FC<Props> = ({
  achievement,
  size = "md",
  showDetails = false,
  onClick,
}) => {
  const { unlocked, tier, icon, progress, maxProgress } = achievement;
  const config = TIER_CONFIG[tier];
  const IconComponent = ICON_MAP[icon] || Trophy;

  const sizeClasses = {
    sm: "w-10 h-10 text-base",
    md: "w-13 h-13 text-xl",
    lg: "w-18 h-18 text-3xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center transition-all ${
        onClick ? "cursor-pointer active:scale-95" : ""
      }`}
    >
      {/* Badge Medallion Frame */}
      <div
        className={`relative ${sizeClasses[size]} rounded-2xl flex items-center justify-center p-0.5 border transition-all duration-300 ${
          unlocked
            ? `${config.border} bg-gradient-to-b ${config.bgGradient} group-hover:scale-105`
            : "border-white/10 bg-[#161922] opacity-65"
        }`}
      >
        {/* Ambient Radial Glow */}
        {unlocked && (
          <div
            className={`absolute inset-0 rounded-2xl ${config.glow} blur-md -z-10 pointer-events-none`}
          />
        )}

        {/* Inner Medal Facet */}
        <div
          className={`w-full h-full rounded-[14px] flex items-center justify-center relative overflow-hidden ${
            unlocked
              ? "bg-[#0E1117]/80 backdrop-blur-sm"
              : "bg-[#0E1117]/90"
          }`}
        >
          {/* Subtle metallic diagonal sheen */}
          {unlocked && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none" />
          )}

          {/* Icon */}
          {unlocked ? (
            <IconComponent
              className={`${iconSizes[size]} ${config.text} drop-shadow-md transition-transform group-hover:scale-110`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
          )}

          {/* Unlocked checkmark pill */}
          {unlocked && size !== "sm" && (
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Tier Tag Pill */}
      {size !== "sm" && (
        <span
          className={`mt-1.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
            unlocked ? config.badgeBg : "bg-white/5 border-white/10 text-gray-500"
          }`}
        >
          {config.name}
        </span>
      )}

      {/* Progress pill if locked */}
      {!unlocked && maxProgress > 1 && size !== "sm" && (
        <span className="mt-0.5 text-[9px] font-mono text-gray-500">
          {progress}/{maxProgress}
        </span>
      )}
    </div>
  );
};
