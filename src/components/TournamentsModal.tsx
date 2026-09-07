import React, { useState } from "react";
import { Swords, Trophy, Clock, Users, Coins, Sparkles, Check, ArrowRight } from "lucide-react";
import { Tournament, PlayerProfile } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";
import { savePlayerProfile } from "../services/storage";

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onSelectGame: (game: "tictactoe" | "archery") => void;
}

export const TournamentsModal: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onSelectGame,
}) => {
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);

  const tournaments: Tournament[] = [
    {
      id: "tourney_archery_weekly",
      title: "Weekly Archery Championship",
      gameType: "archery",
      prizePool: "15,000 Coins",
      entryFee: 100,
      participants: 142,
      maxParticipants: 200,
      status: "active",
      endsIn: "2d 14h",
      badge: "🎯",
    },
    {
      id: "tourney_tictac_blitz",
      title: "Tic-Tac-Toe Blitz Masters",
      gameType: "tictactoe",
      prizePool: "8,000 Coins",
      entryFee: 50,
      participants: 88,
      maxParticipants: 128,
      status: "active",
      endsIn: "18h 30m",
      badge: "❌",
    },
    {
      id: "tourney_weekend_clash",
      title: "Grand Weekend Arena Cup",
      gameType: "archery",
      prizePool: "25,000 Coins",
      entryFee: 250,
      participants: 45,
      maxParticipants: 256,
      status: "upcoming",
      endsIn: "Starts in 4d",
      badge: "👑",
    },
  ];

  const handleJoin = (t: Tournament) => {
    if (joinedTournaments.includes(t.id)) {
      onSelectGame(t.gameType);
      return;
    }

    if (profile.coins < t.entryFee) {
      triggerHaptic("error");
      return;
    }

    soundManager.playClick();
    triggerHaptic("success");

    const updated = { ...profile, coins: profile.coins - t.entryFee };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    setJoinedTournaments((prev) => [...prev, t.id]);
  };

  return (
    <div className="w-full flex flex-col px-5 py-4 pb-24 select-none">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Tournaments</span>
          <Swords className="w-4 h-4 text-indigo-400" />
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Compete in ranked weekly cups for massive prize pools
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {tournaments.map((t) => {
          const isJoined = joinedTournaments.includes(t.id);
          return (
            <div
              key={t.id}
              className="p-4 rounded-[28px] bg-white/5 border border-white/10 shadow-xl flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Top Row: Title & Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl shadow">
                    {t.badge}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{t.endsIn}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span>
                          {t.participants}/{t.maxParticipants}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    t.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              {/* Prize & Entry Fee */}
              <div className="grid grid-cols-2 gap-2 bg-[#1C1F26] p-2.5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Prize Pool</span>
                    <span className="text-xs font-black text-amber-300 font-mono">{t.prizePool}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Entry Fee</span>
                    <span className="text-xs font-black text-indigo-300 font-mono">{t.entryFee} Coins</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleJoin(t)}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
                  isJoined
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
                }`}
              >
                {isJoined ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Registered • Play Qualifier</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enter Tournament ({t.entryFee} Coins)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
