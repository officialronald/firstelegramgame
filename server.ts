import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

// --- In-Memory Game Platform State ---
interface Player {
  id: string;
  name: string;
  avatar: string;
  ws?: WebSocket;
  symbol?: "X" | "O";
  score: number;
  ready?: boolean;
}

interface TicTacToeState {
  board: (string | null)[];
  turn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  winningLine: number[] | null;
  rematchVotes: string[];
}

interface ArcheryState {
  currentRound: number;
  maxRounds: number;
  currentShooterIndex: number;
  shotsLeftInRound: Record<string, number>;
  scores: Record<string, number>;
  lastShot: {
    playerId: string;
    score: number;
    accuracyRing: string;
    isBullseye: boolean;
    wind: number;
    distance: number;
  } | null;
  rematchVotes: string[];
}

interface GameRoom {
  id: string;
  gameType: "tictactoe" | "archery";
  isPrivate: boolean;
  players: Player[];
  status: "waiting" | "playing" | "ended";
  createdAt: number;
  tictactoeState?: TicTacToeState;
  archeryState?: ArcheryState;
}

const rooms = new Map<string, GameRoom>();
const matchmakingQueues = {
  tictactoe: [] as { player: Player; ws: WebSocket }[],
  archery: [] as { player: Player; ws: WebSocket }[],
};

// Seed initial leaderboard entries
interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  wins: number;
  game: "all" | "tictactoe" | "archery";
  rankTitle: string;
}

const leaderboardData: LeaderboardEntry[] = [
  { id: "seed-1", name: "Alex_Telegram", avatar: "🏹", score: 3820, wins: 48, game: "all", rankTitle: "Grandmaster" },
  { id: "seed-2", name: "Dmitry_Pro", avatar: "⚡", score: 3410, wins: 41, game: "tictactoe", rankTitle: "Master" },
  { id: "seed-3", name: "Elena_Archer", avatar: "🎯", score: 3190, wins: 39, game: "archery", rankTitle: "Diamond" },
  { id: "seed-4", name: "CryptoSamurai", avatar: "⚔️", score: 2980, wins: 33, game: "all", rankTitle: "Diamond" },
  { id: "seed-5", name: "MaxSpeed", avatar: "🚀", score: 2650, wins: 29, game: "tictactoe", rankTitle: "Platinum" },
  { id: "seed-6", name: "Sophia_Bullseye", avatar: "🌟", score: 2540, wins: 26, game: "archery", rankTitle: "Gold" },
  { id: "seed-7", name: "Nikita_Gamer", avatar: "🎮", score: 2210, wins: 21, game: "all", rankTitle: "Gold" },
  { id: "seed-8", name: "Pavel_D", avatar: "✈️", score: 1980, wins: 18, game: "tictactoe", rankTitle: "Silver" },
];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function checkTicTacToeWinner(board: (string | null)[]): { winner: "X" | "O" | "draw" | null; line: number[] | null } {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line: [a, b, c] };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }

  return { winner: null, line: null };
}

function broadcastToRoom(room: GameRoom, message: any, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  for (const p of room.players) {
    if (p.ws && p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
      try {
        p.ws.send(data);
      } catch (err) {
        console.error("Failed to send message to player:", err);
      }
    }
  }
}

function getSanitizedRoom(room: GameRoom) {
  return {
    id: room.id,
    gameType: room.gameType,
    isPrivate: room.isPrivate,
    status: room.status,
    createdAt: room.createdAt,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      symbol: p.symbol,
      score: p.score,
      ready: p.ready,
    })),
    tictactoeState: room.tictactoeState,
    archeryState: room.archeryState,
  };
}

// --- REST API Endpoints ---
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    activeRooms: rooms.size,
    platform: "Telegram Games Arena",
  });
});

app.get("/api/leaderboards", (req, res) => {
  const game = (req.query.game as string) || "all";
  let filtered = leaderboardData;
  if (game !== "all") {
    filtered = leaderboardData.filter((entry) => entry.game === game || entry.game === "all");
  }
  const sorted = [...filtered].sort((a, b) => b.score - a.score);
  res.json({ entries: sorted });
});

app.post("/api/leaderboards/submit", (req, res) => {
  const { id, name, avatar, scoreDelta, won, game } = req.body;
  if (!id || !name) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = leaderboardData.find((e) => e.id === id);
  if (existing) {
    existing.score += Number(scoreDelta || 0);
    if (won) existing.wins += 1;
    if (avatar) existing.avatar = avatar;
    if (name) existing.name = name;
  } else {
    leaderboardData.push({
      id,
      name,
      avatar: avatar || "🎮",
      score: Math.max(100, Number(scoreDelta || 100)),
      wins: won ? 1 : 0,
      game: (game as any) || "all",
      rankTitle: "Contender",
    });
  }

  leaderboardData.sort((a, b) => b.score - a.score);
  res.json({ success: true, user: leaderboardData.find((e) => e.id === id) });
});

app.get("/api/stats", (_req, res) => {
  res.json({
    totalRooms: rooms.size,
    matchmakingTicTacToe: matchmakingQueues.tictactoe.length,
    matchmakingArchery: matchmakingQueues.archery.length,
    activeTournaments: 2,
  });
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Map WebSocket connection to active metadata
  const clientData = new Map<
    WebSocket,
    {
      playerId: string;
      name: string;
      avatar: string;
      roomId: string | null;
      queueGame: "tictactoe" | "archery" | null;
    }
  >();

  wss.on("connection", (ws: WebSocket) => {
    clientData.set(ws, {
      playerId: "player_" + Math.random().toString(36).substring(2, 9),
      name: "Player",
      avatar: "👤",
      roomId: null,
      queueGame: null,
    });

    ws.on("message", (rawMessage: string) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        handleWsMessage(ws, msg);
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });

    // Send connection established confirmation
    ws.send(
      JSON.stringify({
        type: "connected",
        playerId: clientData.get(ws)?.playerId,
      })
    );
  });

  function handleDisconnect(ws: WebSocket) {
    const data = clientData.get(ws);
    if (!data) return;

    // Remove from matchmaking queues
    if (data.queueGame) {
      const q = matchmakingQueues[data.queueGame];
      const idx = q.findIndex((item) => item.ws === ws);
      if (idx !== -1) q.splice(idx, 1);
    }

    // Handle room departure
    if (data.roomId) {
      const room = rooms.get(data.roomId);
      if (room) {
        room.players = room.players.filter((p) => p.id !== data.playerId);
        if (room.players.length === 0) {
          rooms.delete(data.roomId);
        } else {
          broadcastToRoom(room, {
            type: "player_left",
            playerId: data.playerId,
            playerName: data.name,
            room: getSanitizedRoom(room),
          });
          room.status = "ended";
        }
      }
    }

    clientData.delete(ws);
  }

  function handleWsMessage(ws: WebSocket, msg: any) {
    const data = clientData.get(ws);
    if (!data) return;

    switch (msg.type) {
      case "register_player": {
        if (msg.playerId) data.playerId = msg.playerId;
        if (msg.name) data.name = msg.name;
        if (msg.avatar) data.avatar = msg.avatar;
        ws.send(JSON.stringify({ type: "registered", player: { id: data.playerId, name: data.name, avatar: data.avatar } }));
        break;
      }

      case "create_room": {
        const gameType: "tictactoe" | "archery" = msg.gameType === "archery" ? "archery" : "tictactoe";
        const roomId = generateRoomCode();
        data.roomId = roomId;

        const hostPlayer: Player = {
          id: data.playerId,
          name: data.name,
          avatar: data.avatar,
          ws,
          score: 0,
          symbol: gameType === "tictactoe" ? "X" : undefined,
          ready: true,
        };

        const room: GameRoom = {
          id: roomId,
          gameType,
          isPrivate: Boolean(msg.isPrivate),
          players: [hostPlayer],
          status: "waiting",
          createdAt: Date.now(),
        };

        if (gameType === "tictactoe") {
          room.tictactoeState = {
            board: Array(9).fill(null),
            turn: "X",
            winner: null,
            winningLine: null,
            rematchVotes: [],
          };
        } else {
          room.archeryState = {
            currentRound: 1,
            maxRounds: 3,
            currentShooterIndex: 0,
            shotsLeftInRound: { [data.playerId]: 3 },
            scores: { [data.playerId]: 0 },
            lastShot: null,
            rematchVotes: [],
          };
        }

        rooms.set(roomId, room);
        ws.send(JSON.stringify({ type: "room_created", room: getSanitizedRoom(room) }));
        break;
      }

      case "join_room": {
        const code = (msg.roomId || "").trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found or expired." }));
          return;
        }

        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: "error", message: "Room is already full." }));
          return;
        }

        data.roomId = code;
        const joinPlayer: Player = {
          id: data.playerId,
          name: data.name,
          avatar: data.avatar,
          ws,
          score: 0,
          symbol: room.gameType === "tictactoe" ? "O" : undefined,
          ready: true,
        };

        room.players.push(joinPlayer);
        room.status = "playing";

        if (room.gameType === "archery" && room.archeryState) {
          room.archeryState.shotsLeftInRound[data.playerId] = 3;
          room.archeryState.scores[data.playerId] = 0;
        }

        broadcastToRoom(room, {
          type: "game_started",
          room: getSanitizedRoom(room),
          message: `${joinPlayer.name} joined! Match starting!`,
        });
        break;
      }

      case "quick_match": {
        const gameType: "tictactoe" | "archery" = msg.gameType === "archery" ? "archery" : "tictactoe";
        const queue = matchmakingQueues[gameType];
        data.queueGame = gameType;

        // Check if there is already a waiting player
        if (queue.length > 0) {
          const opponent = queue.shift()!;
          const roomId = generateRoomCode();

          data.roomId = roomId;
          const oppData = clientData.get(opponent.ws);
          if (oppData) oppData.roomId = roomId;

          const player1: Player = {
            id: opponent.player.id,
            name: opponent.player.name,
            avatar: opponent.player.avatar,
            ws: opponent.ws,
            score: 0,
            symbol: gameType === "tictactoe" ? "X" : undefined,
            ready: true,
          };

          const player2: Player = {
            id: data.playerId,
            name: data.name,
            avatar: data.avatar,
            ws,
            score: 0,
            symbol: gameType === "tictactoe" ? "O" : undefined,
            ready: true,
          };

          const room: GameRoom = {
            id: roomId,
            gameType,
            isPrivate: false,
            players: [player1, player2],
            status: "playing",
            createdAt: Date.now(),
          };

          if (gameType === "tictactoe") {
            room.tictactoeState = {
              board: Array(9).fill(null),
              turn: "X",
              winner: null,
              winningLine: null,
              rematchVotes: [],
            };
          } else {
            room.archeryState = {
              currentRound: 1,
              maxRounds: 3,
              currentShooterIndex: 0,
              shotsLeftInRound: { [player1.id]: 3, [player2.id]: 3 },
              scores: { [player1.id]: 0, [player2.id]: 0 },
              lastShot: null,
              rematchVotes: [],
            };
          }

          rooms.set(roomId, room);
          broadcastToRoom(room, {
            type: "match_found",
            room: getSanitizedRoom(room),
          });
        } else {
          // Push to queue
          queue.push({
            player: {
              id: data.playerId,
              name: data.name,
              avatar: data.avatar,
              score: 0,
            },
            ws,
          });
          ws.send(JSON.stringify({ type: "matchmaking_waiting", gameType }));
        }
        break;
      }

      case "cancel_match": {
        if (data.queueGame) {
          const q = matchmakingQueues[data.queueGame];
          const idx = q.findIndex((item) => item.ws === ws);
          if (idx !== -1) q.splice(idx, 1);
          data.queueGame = null;
          ws.send(JSON.stringify({ type: "matchmaking_cancelled" }));
        }
        break;
      }

      case "tictactoe_move": {
        const { roomId, cellIndex } = msg;
        const room = rooms.get(roomId);
        if (!room || room.gameType !== "tictactoe" || !room.tictactoeState) return;
        if (room.status !== "playing") return;

        const player = room.players.find((p) => p.id === data.playerId);
        if (!player || player.symbol !== room.tictactoeState.turn) {
          ws.send(JSON.stringify({ type: "error", message: "Not your turn!" }));
          return;
        }

        if (room.tictactoeState.board[cellIndex] !== null) {
          ws.send(JSON.stringify({ type: "error", message: "Cell already taken!" }));
          return;
        }

        // Apply move
        room.tictactoeState.board[cellIndex] = player.symbol;

        // Check for winner
        const result = checkTicTacToeWinner(room.tictactoeState.board);
        if (result.winner) {
          room.tictactoeState.winner = result.winner;
          room.tictactoeState.winningLine = result.line;
          room.status = "ended";

          if (result.winner !== "draw") {
            const winnerPlayer = room.players.find((p) => p.symbol === result.winner);
            if (winnerPlayer) winnerPlayer.score += 1;
          }
        } else {
          room.tictactoeState.turn = room.tictactoeState.turn === "X" ? "O" : "X";
        }

        broadcastToRoom(room, {
          type: "tictactoe_update",
          room: getSanitizedRoom(room),
          lastMove: { playerId: data.playerId, cellIndex, symbol: player.symbol },
        });
        break;
      }

      case "archery_shot": {
        const { roomId, score, accuracyRing, isBullseye, wind, distance } = msg;
        const room = rooms.get(roomId);
        if (!room || room.gameType !== "archery" || !room.archeryState) return;

        const state = room.archeryState;
        const currentShooter = room.players[state.currentShooterIndex];
        if (currentShooter.id !== data.playerId) {
          ws.send(JSON.stringify({ type: "error", message: "Wait for your turn to shoot!" }));
          return;
        }

        // Add score
        state.scores[data.playerId] = (state.scores[data.playerId] || 0) + Number(score);
        state.shotsLeftInRound[data.playerId] = Math.max(0, (state.shotsLeftInRound[data.playerId] || 3) - 1);

        state.lastShot = {
          playerId: data.playerId,
          score,
          accuracyRing,
          isBullseye,
          wind,
          distance,
        };

        // Check if round/game ends or advance shooter
        const nextShooterIndex = (state.currentShooterIndex + 1) % room.players.length;
        const allShotsExhausted = room.players.every((p) => (state.shotsLeftInRound[p.id] || 0) <= 0);

        if (allShotsExhausted) {
          if (state.currentRound >= state.maxRounds) {
            room.status = "ended";
          } else {
            state.currentRound += 1;
            room.players.forEach((p) => {
              state.shotsLeftInRound[p.id] = 3;
            });
            state.currentShooterIndex = 0;
          }
        } else {
          state.currentShooterIndex = nextShooterIndex;
        }

        broadcastToRoom(room, {
          type: "archery_update",
          room: getSanitizedRoom(room),
        });
        break;
      }

      case "rematch_request": {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) return;

        const state = room.gameType === "tictactoe" ? room.tictactoeState : room.archeryState;
        if (!state) return;

        if (!state.rematchVotes.includes(data.playerId)) {
          state.rematchVotes.push(data.playerId);
        }

        if (state.rematchVotes.length >= room.players.length) {
          // Reset game
          room.status = "playing";
          if (room.gameType === "tictactoe" && room.tictactoeState) {
            // Swap symbols for variety
            room.players.forEach((p) => {
              p.symbol = p.symbol === "X" ? "O" : "X";
            });
            room.tictactoeState.board = Array(9).fill(null);
            room.tictactoeState.turn = "X";
            room.tictactoeState.winner = null;
            room.tictactoeState.winningLine = null;
            room.tictactoeState.rematchVotes = [];
          } else if (room.gameType === "archery" && room.archeryState) {
            room.archeryState.currentRound = 1;
            room.archeryState.currentShooterIndex = 0;
            room.archeryState.rematchVotes = [];
            room.players.forEach((p) => {
              room.archeryState!.shotsLeftInRound[p.id] = 3;
              room.archeryState!.scores[p.id] = 0;
            });
            room.archeryState.lastShot = null;
          }

          broadcastToRoom(room, {
            type: "rematch_accepted",
            room: getSanitizedRoom(room),
          });
        } else {
          broadcastToRoom(room, {
            type: "rematch_requested",
            fromPlayerId: data.playerId,
            fromPlayerName: data.name,
          });
        }
        break;
      }

      case "send_reaction": {
        const { roomId, emoji } = msg;
        const room = rooms.get(roomId);
        if (room) {
          broadcastToRoom(room, {
            type: "reaction_received",
            playerId: data.playerId,
            playerName: data.name,
            emoji,
          });
        }
        break;
      }

      case "leave_room": {
        handleDisconnect(ws);
        data.roomId = null;
        ws.send(JSON.stringify({ type: "left_room" }));
        break;
      }
    }
  }

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Telegram Games Arena Server running on port ${PORT}`);
  });
}

startServer();
