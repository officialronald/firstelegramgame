import React, { useState, useEffect, useCallback } from "react";
import { PlayerProfile, GameType, GameMode, ServerRoom } from "./types";
import { initTelegram, isTelegramEnvironment } from "./services/telegram";
import { getOrCreatePlayerProfile, savePlayerProfile } from "./services/storage";
import { socketClient } from "./services/socket";
import { soundManager } from "./services/sound";
import { TelegramHeader } from "./components/TelegramHeader";
import { Navigation, NavTab } from "./components/Navigation";
import { Lobby } from "./components/Lobby";
import { TicTacToeGame } from "./components/TicTacToe/TicTacToeGame";
import { ArcheryGame } from "./components/Archery/ArcheryGame";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { ProfileModal } from "./components/ProfileModal";
import { TournamentsModal } from "./components/TournamentsModal";
import { MultiplayerModal } from "./components/MultiplayerModal";
import { AchievementToast } from "./components/AchievementToast";
import { achievementManager } from "./services/achievements";

export default function App() {
  // Player state
  const [profile, setProfile] = useState<PlayerProfile>(() => getOrCreatePlayerProfile());
  const [soundOn, setSoundOn] = useState(() => soundManager.isEnabled());
  const [onlineStatus, setOnlineStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  // Navigation / View State
  const [activeTab, setActiveTab] = useState<NavTab>("lobby");
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("single_ai");
  const [activeRoom, setActiveRoom] = useState<ServerRoom | null>(null);

  // Multiplayer Modal State
  const [multiplayerModal, setMultiplayerModal] = useState<{
    isOpen: boolean;
    gameType: GameType;
    title: string;
  }>({
    isOpen: false,
    gameType: "tictactoe",
    title: "Tic-Tac-Toe",
  });

  // Initialize Telegram WebApp & WebSocket
  useEffect(() => {
    initTelegram();
    socketClient.connect(profile);

    const handleConnectionStatus = (payload: any) => {
      setOnlineStatus(payload.status);
    };

    socketClient.on("connection_status", handleConnectionStatus);

    // Sync profile on achievement unlocks
    const unsubscribeAchievements = achievementManager.subscribe(() => {
      setProfile(getOrCreatePlayerProfile());
    });

    return () => {
      socketClient.off("connection_status", handleConnectionStatus);
      unsubscribeAchievements();
    };
  }, [profile]);

  // Check URL query parameters for direct room joining (e.g. from Telegram invite links)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("room");
    const gameParam = params.get("game");

    if (roomCode) {
      const gType: GameType = gameParam === "archery" ? "archery" : "tictactoe";
      // Auto join room via socket
      socketClient.send({
        type: "join_room",
        roomId: roomCode.trim().toUpperCase(),
      });
      // Listen for game start
      const handleGameStarted = (payload: any) => {
        if (payload.room) {
          setActiveRoom(payload.room);
          setGameMode("online_room");
          setActiveGame(gType);
        }
      };
      socketClient.on("game_started", handleGameStarted);
      return () => {
        socketClient.off("game_started", handleGameStarted);
      };
    }
  }, []);

  const handleUpdateProfile = (updated: PlayerProfile) => {
    setProfile(updated);
  };

  const handleToggleSound = () => {
    const nextState = soundManager.toggleSound();
    setSoundOn(nextState);
  };

  const handleLaunchTicTacToe = (mode: GameMode = "single_ai") => {
    setGameMode(mode);
    setActiveRoom(null);
    setActiveGame("tictactoe");
  };

  const handleLaunchArchery = () => {
    setActiveRoom(null);
    setActiveGame("archery");
  };

  const handleOpenMultiplayerModal = (gameType: GameType, title: string) => {
    setMultiplayerModal({
      isOpen: true,
      gameType,
      title,
    });
  };

  const handleMultiplayerGameStart = (room: ServerRoom) => {
    setActiveRoom(room);
    setGameMode(room.isPrivate ? "online_room" : "quick_match");
    setActiveGame(room.gameType);
  };

  const handleBackToLobby = () => {
    setActiveGame(null);
    setActiveRoom(null);
    setActiveTab("lobby");
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-white flex justify-center font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      {/* Immersive Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-[#4F46E5] opacity-20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-[#7C3AED] opacity-20 blur-[120px] rounded-full" />
      </div>

      {/* Main Mobile Device / Responsive Frame */}
      <div className="relative w-full max-w-md bg-[#0E1117] min-h-screen border-x border-[#1C1F26] shadow-2xl flex flex-col z-10">
        {/* Subtle status notch bar */}
        <div className="w-full h-4 flex items-end justify-center">
          <div className="w-20 h-2.5 bg-black/70 rounded-b-xl"></div>
        </div>

        {/* Telegram App Header */}
        <TelegramHeader
          profile={profile}
          onOpenProfile={() => {
            setActiveGame(null);
            setActiveTab("profile");
          }}
          onlineStatus={onlineStatus}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />

        {/* Main View Container */}
        <main className="flex-1 flex flex-col w-full">
          {activeGame === "tictactoe" ? (
            <TicTacToeGame
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onBackToLobby={handleBackToLobby}
              initialRoom={activeRoom}
              initialMode={gameMode}
            />
          ) : activeGame === "archery" ? (
            <ArcheryGame
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onBackToLobby={handleBackToLobby}
              initialRoom={activeRoom}
            />
          ) : activeTab === "lobby" ? (
            <Lobby
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onLaunchTicTacToe={handleLaunchTicTacToe}
              onLaunchArchery={handleLaunchArchery}
              onOpenMultiplayer={handleOpenMultiplayerModal}
            />
          ) : activeTab === "leaderboards" ? (
            <LeaderboardModal profile={profile} />
          ) : activeTab === "tournaments" ? (
            <TournamentsModal
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSelectGame={(game) => {
                if (game === "tictactoe") handleLaunchTicTacToe("single_ai");
                else handleLaunchArchery();
              }}
            />
          ) : activeTab === "profile" ? (
            <ProfileModal profile={profile} onUpdateProfile={handleUpdateProfile} />
          ) : null}
        </main>

        {/* Multiplayer Matchmaking & Room PIN Modal */}
        <MultiplayerModal
          isOpen={multiplayerModal.isOpen}
          onClose={() => setMultiplayerModal((prev) => ({ ...prev, isOpen: false }))}
          gameType={multiplayerModal.gameType}
          gameTitle={multiplayerModal.title}
          onGameStart={handleMultiplayerGameStart}
        />

        {/* Bottom Navigation (Visible when not actively playing a game) */}
        {!activeGame && (
          <Navigation
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveGame(null);
              setActiveTab(tab);
            }}
          />
        )}

        {/* Global Achievement Unlock Toast */}
        <AchievementToast />
      </div>
    </div>
  );
}
