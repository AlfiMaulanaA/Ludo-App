import { createGame, dispatch, getCurrentPlayer, getValidMoves } from '../lib/ludo/engine.js';
import { chooseMove } from '../lib/ludo/ai.js';
import { COLORS } from '../lib/ludo/board.js';

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

export function initSocketServer(io) {
  io.on('connection', socket => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Create Room
    socket.on('CREATE_ROOM', ({ hostName, playerCount = 4, turnTimer = 15, botFill = true }, callback) => {
      const roomCode = generateRoomCode();
      const playerColor = COLORS[0];
      const hostPlayer = {
        socketId: socket.id,
        id: `p0`,
        name: hostName || 'Host',
        color: playerColor,
        type: 'human',
        isReady: true,
        isConnected: true
      };

      const room = {
        code: roomCode,
        hostSocketId: socket.id,
        status: 'LOBBY',
        config: {
          playerCount: Math.min(4, Math.max(2, Number(playerCount))),
          turnTimer: Number(turnTimer),
          botFill: Boolean(botFill)
        },
        players: [hostPlayer],
        game: null,
        afk: {},
        autoTimer: null,
        chat: []
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerId = hostPlayer.id;

      if (typeof callback === 'function') {
        callback({ success: true, roomCode, player: hostPlayer, roomState: getRoomState(room) });
      }
    });

    // Join Room
    socket.on('JOIN_ROOM', ({ roomCode, playerName }, callback) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return callback?.({ success: false, error: 'Ruangan tidak ditemukan' });
      }
      if (room.status !== 'LOBBY') {
        return callback?.({ success: false, error: 'Permainan sudah berlangsung' });
      }

      const existingSockets = room.players.filter(p => p.type === 'human');
      if (existingSockets.length >= room.config.playerCount) {
        return callback?.({ success: false, error: 'Ruangan sudah penuh' });
      }

      const playerIndex = room.players.length;
      const playerColor = COLORS[playerIndex];
      const newPlayer = {
        socketId: socket.id,
        id: `p${playerIndex}`,
        name: playerName || `Pemain ${playerIndex + 1}`,
        color: playerColor,
        type: 'human',
        isReady: false,
        isConnected: true
      };

      room.players.push(newPlayer);
      socket.join(code);
      socket.roomCode = code;
      socket.playerId = newPlayer.id;

      io.to(code).emit('ROOM_UPDATED', getRoomState(room));
      callback?.({ success: true, roomCode: code, player: newPlayer, roomState: getRoomState(room) });
    });

    // Quick Matchmaking (Find or Create open room)
    socket.on('QUICK_MATCH', ({ playerName }, callback) => {
      // Look for open room with space
      let targetRoom = null;
      for (const room of rooms.values()) {
        if (room.status === 'LOBBY' && room.players.filter(p => p.type === 'human').length < room.config.playerCount) {
          targetRoom = room;
          break;
        }
      }

      if (targetRoom) {
        // Join existing
        const playerIndex = targetRoom.players.length;
        const playerColor = COLORS[playerIndex];
        const newPlayer = {
          socketId: socket.id,
          id: `p${playerIndex}`,
          name: playerName || `Pemain ${playerIndex + 1}`,
          color: playerColor,
          type: 'human',
          isReady: true,
          isConnected: true
        };
        targetRoom.players.push(newPlayer);
        socket.join(targetRoom.code);
        socket.roomCode = targetRoom.code;
        socket.playerId = newPlayer.id;

        io.to(targetRoom.code).emit('ROOM_UPDATED', getRoomState(targetRoom));
        callback?.({ success: true, roomCode: targetRoom.code, player: newPlayer, roomState: getRoomState(targetRoom) });
      } else {
        // Create new
        const roomCode = generateRoomCode();
        const playerColor = COLORS[0];
        const hostPlayer = {
          socketId: socket.id,
          id: `p0`,
          name: playerName || 'Pemain 1',
          color: playerColor,
          type: 'human',
          isReady: true,
          isConnected: true
        };
        const room = {
          code: roomCode,
          hostSocketId: socket.id,
          status: 'LOBBY',
          config: { playerCount: 4, turnTimer: 15, botFill: true },
          players: [hostPlayer],
          game: null,
          afk: {},
          autoTimer: null,
          chat: []
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.playerId = hostPlayer.id;

        callback?.({ success: true, roomCode, player: hostPlayer, roomState: getRoomState(room) });
      }
    });

    // Toggle Ready
    socket.on('TOGGLE_READY', () => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.status !== 'LOBBY') return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        io.to(room.code).emit('ROOM_UPDATED', getRoomState(room));
      }
    });

    // Start Online Game (Host Only)
    socket.on('START_GAME', (options, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.hostSocketId !== socket.id || room.status !== 'LOBBY') {
        return callback?.({ success: false, error: 'Hanya host yang dapat memulai permainan' });
      }

      // Fill remaining slots with Bots if configured
      while (room.players.length < room.config.playerCount) {
        const botIdx = room.players.length;
        room.players.push({
          socketId: null,
          id: `p${botIdx}`,
          name: `Bot ${botIdx + 1}`,
          color: COLORS[botIdx],
          type: 'bot',
          botDifficulty: 'medium',
          isReady: true,
          isConnected: true
        });
      }

      const gameConfig = room.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        type: p.type,
        botDifficulty: p.botDifficulty || 'medium'
      }));

      room.game = createGame(gameConfig, {
        turnTimer: room.config.turnTimer,
        enableBlockRule: options?.enableBlockRule || false,
        tripleSix: options?.tripleSix !== false,
        bonusTurnOnCapture: options?.bonusTurnOnCapture !== false
      });
      room.game.isOnlineMode = true;
      room.status = 'PLAYING';

      io.to(room.code).emit('GAME_STARTED', { roomState: getRoomState(room), game: room.game });
      callback?.({ success: true });

      // Check if first player is Bot
      triggerBotIfNeeded(io, room);
    });

    // Authoritative Dice Roll Action
    socket.on('ROLL_DICE', () => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.status !== 'PLAYING' || !room.game) return;

      const activePlayer = getCurrentPlayer(room.game);
      if (activePlayer.id !== socket.playerId) return;
      room.afk[socket.playerId] = 0;

      const ok = dispatch(room.game, { type: 'ROLL_DICE' });
      if (ok) {
        io.to(room.code).emit('GAME_UPDATED', { game: room.game, lastAction: 'ROLL_DICE' });
        triggerBotIfNeeded(io, room);
      }
    });

    // Authoritative Piece Move Action
    socket.on('MOVE_PIECE', ({ pieceId }) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.status !== 'PLAYING' || !room.game) return;

      const activePlayer = getCurrentPlayer(room.game);
      if (activePlayer.id !== socket.playerId) return;
      room.afk[socket.playerId] = 0;

      const ok = dispatch(room.game, { type: 'MOVE_PIECE', pieceId });
      if (ok) {
        io.to(room.code).emit('GAME_UPDATED', { game: room.game, lastAction: 'MOVE_PIECE' });
        triggerBotIfNeeded(io, room);
      }
    });

    // Emote Reaction Broadcast
    socket.on('SEND_EMOTE', ({ emote }) => {
      const room = rooms.get(socket.roomCode);
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        io.to(room.code).emit('EMOTE_RECEIVED', { playerId: player.id, playerName: player.name, emote });
      }
    });

    // Chat Message Broadcast
    socket.on('SEND_CHAT', ({ text }) => {
      const room = rooms.get(socket.roomCode);
      if (!room || !text) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        const msg = { id: String(Date.now()), sender: player.name, color: player.color, text: text.trim().slice(0, 120), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        room.chat.push(msg);
        if (room.chat.length > 50) room.chat.shift();
        io.to(room.code).emit('CHAT_RECEIVED', msg);
      }
    });

    // Disconnect Handling
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const code = socket.roomCode;
      if (!code) return;

      const room = rooms.get(code);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.isConnected = false;
        if (room.status === 'LOBBY') {
          room.players = room.players.filter(p => p.socketId !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(code);
          } else {
            if (room.hostSocketId === socket.id) {
              const nextHost = room.players.find(p => p.type === 'human');
              if (nextHost) room.hostSocketId = nextHost.socketId;
            }
            io.to(code).emit('ROOM_UPDATED', getRoomState(room));
          }
        } else if (room.status === 'PLAYING') {
          // If playing, mark disconnected & enable bot takeover if AFK
          player.type = 'bot'; // Automatic bot takeover on disconnect
          const gamePlayer = room.game?.players.find(p => p.id === player.id);
          if (gamePlayer) gamePlayer.type = 'bot';
          if (!room.players.some(p => p.type === 'human' && p.isConnected)) {
            clearTimeout(room.autoTimer);
            rooms.delete(code);
            return;
          }
          io.to(code).emit('PLAYER_LEFT', { playerId: player.id, name: player.name, roomState: getRoomState(room) });
          triggerBotIfNeeded(io, room);
        }
      }
    });
  });
}

function getRoomState(room) {
  return {
    code: room.code,
    hostSocketId: room.hostSocketId,
    status: room.status,
    config: room.config,
    players: room.players.map(p => ({
      id: p.id,
      socketId: p.socketId,
      name: p.name,
      color: p.color,
      type: p.type,
      isReady: p.isReady,
      isConnected: p.isConnected
    }))
  };
}

const BOT_DELAY_MS = 800;
const AFK_LIMIT = 2;

// Single timer per room: drives bot turns and enforces the human turn timer.
function triggerBotIfNeeded(io, room) {
  if (!room) return;
  clearTimeout(room.autoTimer);
  room.autoTimer = null;
  if (room.status !== 'PLAYING' || !room.game || room.game.turnState === 'GAME_OVER') return;

  const game = room.game;
  const activePlayer = getCurrentPlayer(game);
  if (!activePlayer) return;

  const isBot = activePlayer.type === 'bot';
  const limitMs = (game.settings.turnTimer || 0) * 1000;
  if (!isBot && !limitMs) return;

  const delay = isBot ? BOT_DELAY_MS : limitMs;
  if (!isBot) io.to(room.code).emit('TURN_DEADLINE', { playerId: activePlayer.id, deadline: Date.now() + limitMs });

  const stateAtSchedule = game.turnState;
  const playerAtSchedule = activePlayer.id;
  room.autoTimer = setTimeout(() => {
    room.autoTimer = null;
    // Ignore stale timers: state must be unchanged since scheduling
    if (room.game !== game || game.turnState !== stateAtSchedule || getCurrentPlayer(game)?.id !== playerAtSchedule) return;

    if (!isBot) {
      room.afk[playerAtSchedule] = (room.afk[playerAtSchedule] || 0) + 1;
      if (room.afk[playerAtSchedule] >= AFK_LIMIT) {
        activePlayer.type = 'bot';
        const roomPlayer = room.players.find(p => p.id === playerAtSchedule);
        if (roomPlayer) roomPlayer.type = 'bot';
        io.to(room.code).emit('PLAYER_LEFT', { playerId: activePlayer.id, name: activePlayer.name, reason: 'AFK', roomState: getRoomState(room) });
      }
    }

    if (game.turnState === 'WAITING_FOR_ROLL') {
      dispatch(game, { type: 'ROLL_DICE' });
      io.to(room.code).emit('GAME_UPDATED', { game, lastAction: 'ROLL_DICE' });
    } else if (game.turnState === 'SELECTING_PIECE') {
      const chosen = chooseMove(game, isBot ? activePlayer.botDifficulty || 'medium' : 'easy');
      if (chosen) {
        dispatch(game, { type: 'MOVE_PIECE', pieceId: chosen.id });
        io.to(room.code).emit('GAME_UPDATED', { game, lastAction: 'MOVE_PIECE' });
      }
    }
    triggerBotIfNeeded(io, room);
  }, delay);
}

