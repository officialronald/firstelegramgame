import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RotateCcw, Bot, Users, Globe, Copy, Check, Share2, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";
import { GameMode, AIDifficulty, PlayerProfile, ServerRoom } from "../../types";
import { soundManager } from "../../services/sound";
import { triggerHaptic, shareGameInvite } from "../../services/telegram";
import { socketClient } from "../../services/socket";
import { savePlayerProfile, addMatchHistory } from "../../services/storage";
import { achievementManager } from "../../services/achievements";

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onBackToLobby: () => void;
  initialRoom?: ServerRoom | null;
  initialMode?: GameMode;
}

export const TicTacToeGame: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onBackToLobby,
  initialRoom = null,
  initialMode = "single_ai",
}) => {
  // Game Setup State
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [room, setRoom] = useState<ServerRoom | null>(initialRoom);
  const [copiedLink, setCopiedLink] = useState(false);

  // Board State
  const [board, setBoard] = useState<(string | null)[]>(
    initialRoom?.tictactoeState?.board || Array(9).fill(null)
  );
  const [turn, setTurn] = useState<"X" | "O">(
    initialRoom?.tictactoeState?.turn || "X"
  );
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(
    initialRoom?.tictactoeState?.winner || null
  );
  const [winningLine, setWinningLine] = useState<number[] | null>(
    initialRoom?.tictactoeState?.winningLine || null
  );

  // Scores
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [draws, setDraws] = useState(0);

  // Online status
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  const [opponentRequestedRematch, setOpponentRequestedRematch] = useState(false);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; name: string }[]>([]);
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());

  // Determine local player symbol in online mode
  const isOnline = mode === "online_room" || mode === "quick_match";
  const onlinePlayer = room?.players.find((p) => p.id === profile.id);
  const mySymbol: "X" | "O" = onlinePlayer?.symbol || "X";
  const opponentPlayer = room?.players.find((p) => p.id !== profile.id);
  const isMyTurn = !isOnline || turn === mySymbol;

  // Winning lines mapping
  const WINNING_COMBOS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkWinner = useCallback((currentBoard: (string | null)[]) => {
    for (const [a, b, c] of WINNING_COMBOS) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a] as "X" | "O", line: [a, b, c] };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: "draw" as const, line: null };
    }
    return { winner: null, line: null };
  }, []);

  // Update profile and stats on game end
  const handleGameEnd = useCallback(
    (
      gameWinner: "X" | "O" | "draw",
      currentWinningLine?: number[] | null,
      currentBoard?: (string | null)[]
    ) => {
      const isWin = isOnline
        ? gameWinner === mySymbol
        : mode === "single_ai"
        ? gameWinner === "X"
        : false;

      const isLoss = isOnline
        ? gameWinner !== "draw" && gameWinner !== mySymbol
        : mode === "single_ai"
        ? gameWinner === "O"
        : false;

      const isDraw = gameWinner === "draw";

      if (isWin) {
        soundManager.playWin();
        triggerHaptic("success");
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else if (isLoss) {
        soundManager.playLoss();
        triggerHaptic("error");
      } else {
        soundManager.playMove("O");
      }

      // Update local profile stats
      const updated = { ...profile };
      const ttStats = updated.stats.tictactoe;
      ttStats.played += 1;

      if (isWin) {
        ttStats.won += 1;
        ttStats.streak += 1;
        if (ttStats.streak > ttStats.bestStreak) {
          ttStats.bestStreak = ttStats.streak;
        }
        updated.xp += mode === "online_room" || mode === "quick_match" ? 50 : 25;
        updated.coins += mode === "online_room" ? 60 : 30;
        updated.rating += 15;
      } else if (isLoss) {
        ttStats.lost += 1;
        ttStats.streak = 0;
        updated.xp += 10;
        updated.rating = Math.max(1000, updated.rating - 8);
      } else if (isDraw) {
        ttStats.draws += 1;
        updated.xp += 15;
      }

      savePlayerProfile(updated);
      onUpdateProfile(updated);

      // Track achievements
      const b = currentBoard || board;
      const movesCount = b.filter((cell) => cell !== null).length;
      achievementManager.recordTicTacToeGame({
        isWin,
        isLoss,
        isDraw,
        movesCount,
        winningLine: currentWinningLine ?? winningLine,
        symbol: isOnline
          ? mySymbol
          : mode === "single_ai"
          ? "X"
          : gameWinner === "X"
          ? "X"
          : "O",
        mode,
        difficulty,
        currentStreak: ttStats.streak,
        totalWins: ttStats.won,
        totalPlayed: ttStats.played,
      });

      // Record match history
      const opponentName = isOnline
        ? opponentPlayer?.name || "Online Opponent"
        : mode === "single_ai"
        ? `AI (${difficulty.toUpperCase()})`
        : "Local Player 2";

      addMatchHistory({
        gameType: "tictactoe",
        gameName: "Tic-Tac-Toe",
        opponent: opponentName,
        mode,
        result: isWin ? "win" : isLoss ? "loss" : "draw",
        scoreText: `${scoreX} - ${scoreO}`,
      });
    },
    [
      isOnline,
      mySymbol,
      mode,
      profile,
      onUpdateProfile,
      opponentPlayer,
      difficulty,
      scoreX,
      scoreO,
      board,
      winningLine,
    ]
  );

  // Minimax Algorithm for AI
  const minimax = useCallback(
    (
      newBoard: (string | null)[],
      depth: number,
      isMaximizing: boolean
    ): { score: number; index?: number } => {
      const result = checkWinner(newBoard);
      if (result.winner === "O") return { score: 10 - depth };
      if (result.winner === "X") return { score: depth - 10 };
      if (result.winner === "draw") return { score: 0 };

      const availableMoves = newBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (isMaximizing) {
        let bestScore = -Infinity;
        let bestMove = availableMoves[0];
        for (const move of availableMoves) {
          newBoard[move] = "O";
          const score = minimax(newBoard, depth + 1, false).score;
          newBoard[move] = null;
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        return { score: bestScore, index: bestMove };
      } else {
        let bestScore = Infinity;
        let bestMove = availableMoves[0];
        for (const move of availableMoves) {
          newBoard[move] = "X";
          const score = minimax(newBoard, depth + 1, true).score;
          newBoard[move] = null;
          if (score < bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        return { score: bestScore, index: bestMove };
      }
    },
    [checkWinner]
  );

  // AI Move calculation based on selected difficulty
  const makeAIMove = useCallback(
    (currentBoard: (string | null)[]) => {
      const availableIndices = currentBoard
        .map((cell, idx) => (cell === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (availableIndices.length === 0) return;

      let chosenIndex: number;

      if (difficulty === "easy") {
        // 80% random, 20% smart
        if (Math.random() < 0.8) {
          chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        } else {
          chosenIndex = minimax(currentBoard, 0, true).index ?? availableIndices[0];
        }
      } else if (difficulty === "medium") {
        // Check for immediate win
        for (const idx of availableIndices) {
          currentBoard[idx] = "O";
          if (checkWinner(currentBoard).winner === "O") {
            currentBoard[idx] = null;
            applyMove(idx, "O");
            return;
          }
          currentBoard[idx] = null;
        }
        // Check for immediate block
        for (const idx of availableIndices) {
          currentBoard[idx] = "X";
          if (checkWinner(currentBoard).winner === "X") {
            currentBoard[idx] = null;
            applyMove(idx, "O");
            return;
          }
          currentBoard[idx] = null;
        }
        // 60% chance smart minimax, 40% random
        if (Math.random() < 0.6) {
          chosenIndex = minimax(currentBoard, 0, true).index ?? availableIndices[0];
        } else {
          chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }
      } else {
        // Hard: Unbeatable Minimax
        chosenIndex = minimax(currentBoard, 0, true).index ?? availableIndices[0];
      }

      applyMove(chosenIndex, "O");
    },
    [difficulty, minimax, checkWinner]
  );

  // Apply a move to the board (Local & AI)
  const applyMove = useCallback(
    (index: number, symbol: "X" | "O") => {
      setBoard((prev) => {
        if (prev[index] !== null || winner !== null) return prev;
        const nextBoard = [...prev];
        nextBoard[index] = symbol;

        soundManager.playMove(symbol);
        triggerHaptic("light");

        const res = checkWinner(nextBoard);
        if (res.winner) {
          setWinner(res.winner);
          setWinningLine(res.line);
          if (res.winner === "X") setScoreX((s) => s + 1);
          else if (res.winner === "O") setScoreO((s) => s + 1);
          else setDraws((d) => d + 1);

          handleGameEnd(res.winner, res.line, nextBoard);
        } else {
          setTurn(symbol === "X" ? "O" : "X");
        }

        return nextBoard;
      });
    },
    [winner, checkWinner, handleGameEnd]
  );

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] !== null || winner !== null) return;

    if (isOnline) {
      if (!isMyTurn || !room) return;
      socketClient.send({
        type: "tictactoe_move",
        roomId: room.id,
        cellIndex: index,
      });
      return;
    }

    if (mode === "single_ai") {
      if (turn !== "X") return;
      applyMove(index, "X");
    } else {
      // Local PvP
      applyMove(index, turn);
    }
  };

  // Trigger AI move when it's O's turn in single-player
  useEffect(() => {
    if (mode === "single_ai" && turn === "O" && winner === null) {
      const timer = setTimeout(() => {
        makeAIMove(board);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mode, turn, winner, board, makeAIMove]);

  // Online Room WebSocket synchronization
  useEffect(() => {
    if (!isOnline) return;

    const handleRoomUpdate = (payload: any) => {
      if (payload.room && payload.room.tictactoeState) {
        setRoom(payload.room);
        const state = payload.room.tictactoeState;
        setBoard(state.board);
        setTurn(state.turn);
        setWinner(state.winner);
        setWinningLine(state.winningLine);

        if (state.winner) {
          handleGameEnd(state.winner, state.winningLine, state.board);
        }
      }
    };

    const handleRematchRequested = (payload: any) => {
      if (payload.fromPlayerId !== profile.id) {
        setOpponentRequestedRematch(true);
        triggerHaptic("medium");
      }
    };

    const handleRematchAccepted = (payload: any) => {
      setWaitingForRematch(false);
      setOpponentRequestedRematch(false);
      if (payload.room && payload.room.tictactoeState) {
        setRoom(payload.room);
        setBoard(payload.room.tictactoeState.board);
        setTurn(payload.room.tictactoeState.turn);
        setWinner(null);
        setWinningLine(null);
        triggerHaptic("success");
      }
    };

    const handleReaction = (payload: any) => {
      const newReaction = {
        id: Math.random().toString(),
        emoji: payload.emoji,
        name: payload.playerName,
      };
      setReactions((prev) => [...prev.slice(-4), newReaction]);
      triggerHaptic("light");
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2500);
    };

    socketClient.on("tictactoe_update", handleRoomUpdate);
    socketClient.on("rematch_requested", handleRematchRequested);
    socketClient.on("rematch_accepted", handleRematchAccepted);
    socketClient.on("reaction_received", handleReaction);

    return () => {
      socketClient.off("tictactoe_update", handleRoomUpdate);
      socketClient.off("rematch_requested", handleRematchRequested);
      socketClient.off("rematch_accepted", handleRematchAccepted);
      socketClient.off("reaction_received", handleReaction);
    };
  }, [isOnline, profile.id, handleGameEnd]);

  // Restart/Rematch handler
  const handleRematch = () => {
    soundManager.playClick();
    triggerHaptic("medium");

    if (isOnline && room) {
      setWaitingForRematch(true);
      socketClient.send({
        type: "rematch_request",
        roomId: room.id,
      });
    } else {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinningLine(null);
      setTurn("X");
    }
  };

  const handleSendReaction = (emoji: string) => {
    soundManager.playClick();
    triggerHaptic("selection");
    if (isOnline && room) {
      socketClient.send({
        type: "send_reaction",
        roomId: room.id,
        emoji,
      });
    }
    const myReaction = { id: Math.random().toString(), emoji, name: "You" };
    setReactions((prev) => [...prev.slice(-4), myReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== myReaction.id));
    }, 2500);
  };

  const copyRoomCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.id);
    setCopiedLink(true);
    triggerHaptic("success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full flex flex-col min-h-full px-5 py-3 relative select-none pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            soundManager.playClick();
            if (isOnline && room) {
              socketClient.send({ type: "leave_room", roomId: room.id });
            }
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition active:scale-95 border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundOn(soundManager.toggleSound())}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95"
            title="Toggle sound"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>

          {/* Mode Badge */}
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            {mode === "single_ai" && <Bot className="w-3.5 h-3.5" />}
            {mode === "local_pvp" && <Users className="w-3.5 h-3.5" />}
            {isOnline && <Globe className="w-3.5 h-3.5" />}
            <span>
              {mode === "single_ai"
                ? `AI (${difficulty.toUpperCase()})`
                : mode === "local_pvp"
                ? "Pass & Play"
                : room?.isPrivate
                ? `PIN: ${room.id}`
                : "Quick Match"}
            </span>
          </div>
        </div>
      </div>

      {/* Online Room Info Banner (if friend room) */}
      {isOnline && room && room.players.length < 2 && (
        <div className="mb-4 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col gap-2 animate-pulse">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-200 font-medium">Waiting for player 2 to connect...</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold tracking-wider">
              {room.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Code Copied!" : "Copy Room PIN"}</span>
            </button>
            <button
              onClick={() => shareGameInvite(room.id, "Tic-Tac-Toe")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode / Difficulty Selector if Single AI */}
      {mode === "single_ai" && (
        <div className="flex items-center justify-between bg-white/5 p-1 rounded-2xl border border-white/10 mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMode("single_ai");
                soundManager.playClick();
              }}
              className={`px-3 py-1 text-xs rounded-xl font-medium transition ${
                mode === "single_ai" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Vs AI
            </button>
            <button
              onClick={() => {
                setMode("local_pvp");
                soundManager.playClick();
                handleRematch();
              }}
              className={`px-3 py-1 text-xs rounded-xl font-medium transition ${
                mode === "local_pvp" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Local 2P
            </button>
          </div>

          <div className="flex items-center gap-1">
            {(["easy", "medium", "hard"] as AIDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setDifficulty(lvl);
                  soundManager.playClick();
                  handleRematch();
                }}
                className={`px-2.5 py-0.5 text-[11px] rounded-lg capitalize font-semibold transition ${
                  difficulty === lvl
                    ? "bg-indigo-500 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scoreboard / Players Status */}
      <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/10 mb-4 shadow-lg">
        {/* Player X */}
        <div
          className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
            turn === "X" && !winner
              ? "bg-indigo-500/20 border-indigo-500 shadow-sm shadow-indigo-500/20 scale-[1.02]"
              : "bg-white/5 border-white/5 opacity-80"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xl">
              {isOnline
                ? room?.players.find((p) => p.symbol === "X")?.avatar || "👤"
                : profile.avatar}
            </span>
            <span className="text-sm font-bold text-indigo-400 font-mono">X</span>
          </div>
          <span className="text-xs font-semibold text-gray-200 truncate max-w-[80px]">
            {isOnline
              ? room?.players.find((p) => p.symbol === "X")?.name || "Player X"
              : profile.name}
          </span>
          <span className="text-lg font-black text-indigo-400 font-mono mt-0.5">{scoreX}</span>
        </div>

        {/* Center / Draws or Turn Indicator */}
        <div className="flex flex-col items-center justify-center p-2">
          {winner ? (
            <div className="text-center animate-bounce">
              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Game Over</span>
              <div className="text-sm font-black text-white mt-0.5">
                {winner === "draw" ? "Tie Game!" : `${winner} Wins!`}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Turn</span>
              <div
                className={`mt-1 text-sm font-bold flex items-center gap-1 ${
                  turn === "X" ? "text-indigo-400" : "text-purple-400"
                }`}
              >
                <span>{turn === "X" ? "X's Turn" : "O's Turn"}</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5">{draws} Ties</span>
            </div>
          )}
        </div>

        {/* Player O */}
        <div
          className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
            turn === "O" && !winner
              ? "bg-purple-500/20 border-purple-500 shadow-sm shadow-purple-500/20 scale-[1.02]"
              : "bg-white/5 border-white/5 opacity-80"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xl">
              {isOnline
                ? opponentPlayer?.symbol === "O"
                  ? opponentPlayer.avatar
                  : "🤖"
                : mode === "single_ai"
                ? "🤖"
                : "👥"}
            </span>
            <span className="text-sm font-bold text-purple-400 font-mono">O</span>
          </div>
          <span className="text-xs font-semibold text-gray-200 truncate max-w-[80px]">
            {isOnline
              ? room?.players.find((p) => p.symbol === "O")?.name || "Player O"
              : mode === "single_ai"
              ? "AI Bot"
              : "Player 2"}
          </span>
          <span className="text-lg font-black text-purple-400 font-mono mt-0.5">{scoreO}</span>
        </div>
      </div>

      {/* Floating Reactions Overlay */}
      {reactions.length > 0 && (
        <div className="absolute top-28 left-0 right-0 pointer-events-none flex justify-center gap-3 z-30">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="bg-[#0E1117]/95 border border-white/10 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-50 duration-200"
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-[11px] font-bold text-gray-300">{r.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3x3 Tic-Tac-Toe Grid */}
      <div className="relative aspect-square max-w-[320px] w-full mx-auto my-auto p-3.5 bg-[#0E1117] rounded-[28px] border border-white/10 shadow-2xl">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 h-full w-full">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                id={`cell-${index}`}
                disabled={cell !== null || winner !== null || (isOnline && !isMyTurn)}
                onClick={() => handleCellClick(index)}
                className={`relative rounded-2xl flex items-center justify-center font-mono font-black transition-all duration-200 active:scale-90 ${
                  cell === null
                    ? "bg-[#1C1F26] hover:bg-[#252a34] border border-white/10 cursor-pointer"
                    : isWinningCell
                    ? cell === "X"
                      ? "bg-indigo-500/20 border-2 border-indigo-400 shadow-lg shadow-indigo-500/40"
                      : "bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/40"
                    : "bg-[#1C1F26] border border-white/10"
                }`}
              >
                {cell === "X" && (
                  <span className="text-4xl sm:text-5xl font-black text-indigo-400 drop-shadow-md animate-in zoom-in-75 duration-150">
                    ✕
                  </span>
                )}
                {cell === "O" && (
                  <span className="text-4xl sm:text-5xl font-black text-purple-400 drop-shadow-md animate-in zoom-in-75 duration-150">
                    ◯
                  </span>
                )}
                {cell === null && !winner && isMyTurn && (
                  <span className="opacity-0 hover:opacity-20 text-3xl text-gray-500 font-mono transition">
                    {isOnline ? mySymbol : turn}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Game Reactions Bar */}
      <div className="flex items-center justify-center gap-2 py-2 mt-2">
        {["🔥", "🎯", "👑", "👏", "⚡", "😂"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendReaction(emoji)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg active:scale-90 transition shadow-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Rematch / Next Round Button */}
      {winner && (
        <div className="mt-2 flex flex-col items-center gap-2">
          {opponentRequestedRematch && (
            <span className="text-xs text-indigo-400 font-medium animate-pulse">
              Opponent wants a rematch!
            </span>
          )}
          <button
            onClick={handleRematch}
            disabled={waitingForRematch}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>
              {waitingForRematch
                ? "Waiting for opponent..."
                : opponentRequestedRematch
                ? "Accept Rematch"
                : "Play Again"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
