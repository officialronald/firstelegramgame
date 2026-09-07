import React, { useState, useEffect } from "react";
import { X, Globe, Users, PlusCircle, ArrowRight, Share2, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { GameType, ServerRoom } from "../types";
import { soundManager } from "../services/sound";
import { triggerHaptic, shareGameInvite } from "../services/telegram";
import { socketClient } from "../services/socket";
import { achievementManager } from "../services/achievements";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameType: GameType;
  gameTitle: string;
  onGameStart: (room: ServerRoom) => void;
}

export const MultiplayerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gameType,
  gameTitle,
  onGameStart,
}) => {
  const [activeTab, setActiveTab] = useState<"quick" | "create" | "join">("quick");
  const [joinCode, setJoinCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [createdRoom, setCreatedRoom] = useState<ServerRoom | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search Timer
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // WebSocket listeners for room creation, matchmaking, and joining
  useEffect(() => {
    if (!isOpen) return;

    const handleRoomCreated = (payload: any) => {
      setCreatedRoom(payload.room);
      triggerHaptic("success");
      achievementManager.recordFriendRoom();
    };

    const handleMatchWaiting = () => {
      setIsSearching(true);
      setErrorMsg(null);
    };

    const handleMatchFound = (payload: any) => {
      setIsSearching(false);
      triggerHaptic("success");
      onGameStart(payload.room);
      onClose();
    };

    const handleGameStarted = (payload: any) => {
      triggerHaptic("success");
      onGameStart(payload.room);
      onClose();
    };

    const handleError = (payload: any) => {
      setErrorMsg(payload.message || "An error occurred");
      setIsSearching(false);
      triggerHaptic("error");
    };

    socketClient.on("room_created", handleRoomCreated);
    socketClient.on("matchmaking_waiting", handleMatchWaiting);
    socketClient.on("match_found", handleMatchFound);
    socketClient.on("game_started", handleGameStarted);
    socketClient.on("error", handleError);

    return () => {
      socketClient.off("room_created", handleRoomCreated);
      socketClient.off("matchmaking_waiting", handleMatchWaiting);
      socketClient.off("match_found", handleMatchFound);
      socketClient.off("game_started", handleGameStarted);
      socketClient.off("error", handleError);
    };
  }, [isOpen, onGameStart, onClose]);

  if (!isOpen) return null;

  const handleStartQuickMatch = () => {
    soundManager.playClick();
    triggerHaptic("medium");
    setIsSearching(true);
    setErrorMsg(null);
    socketClient.send({
      type: "quick_match",
      gameType,
    });
  };

  const handleCancelQuickMatch = () => {
    soundManager.playClick();
    setIsSearching(false);
    socketClient.send({
      type: "cancel_match",
    });
  };

  const handleCreatePrivateRoom = () => {
    soundManager.playClick();
    triggerHaptic("medium");
    setErrorMsg(null);
    socketClient.send({
      type: "create_room",
      gameType,
      isPrivate: true,
    });
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    soundManager.playClick();
    triggerHaptic("medium");
    setErrorMsg(null);
    socketClient.send({
      type: "join_room",
      roomId: joinCode.trim().toUpperCase(),
    });
  };

  const copyCode = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.id);
    setCopied(true);
    triggerHaptic("success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05060A]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0E1117] border border-white/10 rounded-[32px] p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => {
            if (isSearching) handleCancelQuickMatch();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-2 text-2xl shadow-md shadow-indigo-500/20">
            ⚔️
          </div>
          <h2 className="text-lg font-bold text-white">Multiplayer Arena</h2>
          <p className="text-xs text-gray-400 mt-0.5">{gameTitle} • Online & Friends</p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#1C1F26] p-1 rounded-2xl border border-white/10 mb-5">
          <button
            onClick={() => {
              setActiveTab("quick");
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "quick" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Quick Match
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              setErrorMsg(null);
              if (!createdRoom) handleCreatePrivateRoom();
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "create" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setActiveTab("join");
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "join" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Join Code
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: Quick Matchmaking */}
        {activeTab === "quick" && (
          <div className="flex flex-col items-center text-center py-2">
            {isSearching ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-indigo-400/50 animate-pulse" />
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-white">Searching for Opponent...</span>
                  <span className="text-xs text-gray-400 font-mono mt-0.5">
                    Queue time: 00:{searchTimer < 10 ? `0${searchTimer}` : searchTimer}
                  </span>
                </div>
                <button
                  onClick={handleCancelQuickMatch}
                  className="mt-2 py-2 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition active:scale-95 border border-white/10"
                >
                  Cancel Search
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2 w-full">
                <p className="text-xs text-gray-300 px-2 leading-relaxed">
                  Join public matchmaking to compete against real Telegram players in real-time.
                </p>
                <button
                  onClick={handleStartQuickMatch}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Globe className="w-4 h-4" />
                  <span>Find Random Match</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Create Private Room */}
        {activeTab === "create" && (
          <div className="flex flex-col items-center text-center py-1">
            {createdRoom ? (
              <div className="w-full flex flex-col items-center gap-3">
                <span className="text-xs text-gray-400">Share this Room PIN with your friend:</span>

                <div className="w-full py-3 px-4 rounded-2xl bg-[#1C1F26] border border-indigo-500/40 flex items-center justify-between shadow-inner">
                  <span className="text-2xl font-black text-indigo-400 font-mono tracking-widest">
                    {createdRoom.id}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition active:scale-95 border border-white/10"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full mt-2">
                  <button
                    onClick={() => shareGameInvite(createdRoom.id, gameTitle)}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/20"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Invite Friend</span>
                  </button>
                  <button
                    onClick={() => {
                      onGameStart(createdRoom);
                      onClose();
                    }}
                    className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs transition active:scale-95 border border-white/10"
                  >
                    Enter Room
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Waiting for guest to connect...</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleCreatePrivateRoom}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-indigo-600/25"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Room PIN</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: Join Private Room */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinByCode} className="flex flex-col gap-3 py-1">
            <span className="text-xs text-gray-400 text-center">Enter the 6-character room PIN:</span>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              className="w-full py-3 px-4 text-center text-xl font-black font-mono tracking-widest rounded-2xl bg-[#1C1F26] border border-white/10 focus:border-indigo-500 focus:outline-none text-white uppercase placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={joinCode.length < 3}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
