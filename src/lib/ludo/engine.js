import { COLORS, FINISH, getGlobalTile, isSafe, syncPieceState } from './board.js';

export const DEFAULT_SETTINGS = {
  autoMove: true,
  turnTimer: 15, // seconds (0 = off, 10, 15, 30)
  tripleSix: true,
  bonusTurnOnCapture: true,
  enableBlockRule: false,
  safeStarts: true,
  musicVolume: 20,
  sfxVolume: 65,
  mute: false,
  animationSpeed: 1,
  reduceMotion: false,
  haptic: true
};

export function rollDice(randomFn = null) {
  if (typeof randomFn === 'function') {
    return Math.floor(randomFn() * 6) + 1;
  }
  // Crypto fair random generator
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    do {
      crypto.getRandomValues(arr);
    } while (arr[0] >= 4294967292);
    return (arr[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
}

export function createGame(config, settings = {}) {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  return {
    version: 1,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    players: config.map((p, i) => ({
      ...p,
      id: p.id || `p${i}`,
      name: p.name || `Pemain ${i + 1}`,
      type: p.type || 'human', // 'human' | 'bot'
      botDifficulty: p.botDifficulty || 'medium', // 'easy' | 'medium' | 'hard'
      color: p.color || COLORS[i],
      isFinished: false,
      rank: null,
      pieces: Array.from({ length: 4 }, (_, j) => {
        const piece = {
          id: `${p.id || `p${i}`}-${j}`,
          playerId: p.id || `p${i}`,
          color: p.color || COLORS[i],
          progress: -1
        };
        syncPieceState(piece, mergedSettings);
        return piece;
      })
    })),
    currentPlayerIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    turnState: 'WAITING_FOR_ROLL', // WAITING_FOR_ROLL | ROLLING_DICE | SELECTING_PIECE | MOVING_PIECE | RESOLVING_CAPTURE | CHECKING_WINNER | GAME_OVER
    rankings: [],
    settings: mergedSettings,
    events: [],
    stats: {
      rolls: 0,
      sixes: 0,
      captures: 0,
      finished: 0,
      byPlayer: config.map(() => ({ captures: 0, captured: 0, rolls: 0, sixes: 0, finished: 0 }))
    },
    elapsedMs: 0,
    turns: 1,
    startedAt: Date.now(),
    turnStartedAt: Date.now()
  };
}

export function getCurrentPlayer(game) {
  return game.players[game.currentPlayerIndex];
}

export function canPieceMove(game, piece, dice = game.diceValue) {
  if (!Number.isInteger(dice) || dice < 1 || dice > 6 || piece.progress === FINISH) {
    return false;
  }
  // Base piece can only come out on a 6
  if (piece.progress < 0 && dice !== 6) {
    return false;
  }
  
  const target = piece.progress < 0 ? 0 : piece.progress + dice;
  // Exact roll required to reach FINISH (56)
  if (target > FINISH) {
    return false;
  }

  // Block rule validation if enabled
  if (game.settings.enableBlockRule) {
    for (let progress = Math.max(0, piece.progress + 1); progress <= target; progress++) {
      const tile = getGlobalTile(piece.color, progress);
      if (tile === null) continue;
      // Check if enemy has a block (2 or more pieces on the tile)
      const enemyHasBlock = game.players.some(p =>
        p.id !== piece.playerId && p.pieces.filter(x => x.globalTileIndex === tile).length >= 2
      );
      if (enemyHasBlock) return false;
    }
  }

  return true;
}

export function getValidMoves(game, player = getCurrentPlayer(game), dice = game.diceValue) {
  if (!player || !player.pieces) return [];
  return player.pieces.filter(piece => canPieceMove(game, piece, dice));
}

export function getNextPlayerIndex(game) {
  for (let n = 1; n <= game.players.length; n++) {
    const nextIdx = (game.currentPlayerIndex + n) % game.players.length;
    if (!game.players[nextIdx].isFinished) {
      return nextIdx;
    }
  }
  return -1;
}

export function checkFinish(piece) {
  return piece.progress === FINISH;
}

export function checkPlayerVictory(player) {
  return player.pieces.every(checkFinish);
}

export function checkCapture(game, piece) {
  if (piece.globalTileIndex === null || isSafe(piece.globalTileIndex, game.settings)) {
    return [];
  }

  const victims = game.players
    .filter(p => p.id !== piece.playerId)
    .flatMap(p => p.pieces)
    .filter(p => p.globalTileIndex === piece.globalTileIndex);

  for (const victim of victims) {
    victim.progress = -1;
    syncPieceState(victim, game.settings);
    const victimPlayerIdx = game.players.findIndex(p => p.id === victim.playerId);
    if (victimPlayerIdx >= 0) {
      game.stats.byPlayer[victimPlayerIdx].captured++;
    }
  }

  if (victims.length > 0) {
    game.stats.captures += victims.length;
    game.stats.byPlayer[game.currentPlayerIndex].captures += victims.length;
  }

  return victims.map(v => v.id);
}

function endTurn(game, grantBonus = false) {
  game.turnState = 'TURN_END';
  const player = getCurrentPlayer(game);
  if (!grantBonus || player.isFinished) {
    game.currentPlayerIndex = getNextPlayerIndex(game);
    game.consecutiveSixes = 0;
  }
  game.diceValue = null;
  game.turns++;
  game.turnStartedAt = Date.now();
  if (game.currentPlayerIndex >= 0) {
    game.turnState = 'WAITING_FOR_ROLL';
  } else {
    game.turnState = 'GAME_OVER';
  }
}

export function dispatch(game, action) {
  const player = getCurrentPlayer(game);
  if (!player || game.turnState === 'GAME_OVER') return false;

  if (action.type === 'ROLL_DICE') {
    if (game.turnState !== 'WAITING_FOR_ROLL') return false;

    const value = action.value ?? rollDice();
    if (!Number.isInteger(value) || value < 1 || value > 6) return false;

    game.events = [];
    game.diceValue = value;
    game.stats.rolls++;
    game.stats.byPlayer[game.currentPlayerIndex].rolls++;

    if (value === 6) {
      game.stats.sixes++;
      game.stats.byPlayer[game.currentPlayerIndex].sixes++;
      game.consecutiveSixes++;
    } else {
      game.consecutiveSixes = 0;
    }

    // Triple six rule check
    if (game.settings.tripleSix && game.consecutiveSixes === 3) {
      game.events.push({ type: 'TRIPLE_SIX', playerId: player.id });
      endTurn(game, false);
      return true;
    }

    game.turnState = 'SELECTING_PIECE';
    const validMoves = getValidMoves(game);

    if (validMoves.length === 0) {
      game.events.push({ type: 'NO_MOVES', playerId: player.id, diceValue: value });
      endTurn(game, value === 6);
    }
    return true;
  }

  if (action.type === 'MOVE_PIECE') {
    if (game.turnState !== 'SELECTING_PIECE') return false;

    const piece = player.pieces.find(p => p.id === action.pieceId);
    if (!piece || !canPieceMove(game, piece, game.diceValue)) return false;

    game.events = [];
    game.turnState = 'MOVING_PIECE';

    const fromProgress = piece.progress;
    piece.progress = fromProgress < 0 ? 0 : fromProgress + game.diceValue;
    syncPieceState(piece, game.settings);

    game.events.push({ type: 'MOVE_PIECE', pieceId: piece.id, from: fromProgress, to: piece.progress });

    game.turnState = 'RESOLVING_CAPTURE';
    const capturedPieceIds = checkCapture(game, piece);
    if (capturedPieceIds.length > 0) {
      game.events.push({ type: 'CAPTURE_PIECE', pieces: capturedPieceIds, capturerId: piece.id });
    }

    if (checkFinish(piece)) {
      game.stats.finished++;
      game.stats.byPlayer[game.currentPlayerIndex].finished++;
      game.events.push({ type: 'PIECE_FINISHED', pieceId: piece.id });
    }

    game.turnState = 'CHECKING_WINNER';
    if (checkPlayerVictory(player)) {
      player.isFinished = true;
      player.rank = game.rankings.length + 1;
      game.rankings.push(player.id);
      game.events.push({ type: 'PLAYER_FINISHED', playerId: player.id, rank: player.rank });
    }

    // Game finished when only 1 player remains unfinished
    if (game.rankings.length >= game.players.length - 1) {
      const lastPlayer = game.players.find(p => !p.isFinished);
      if (lastPlayer) {
        lastPlayer.isFinished = true;
        lastPlayer.rank = game.players.length;
        game.rankings.push(lastPlayer.id);
      }
      game.elapsedMs = Date.now() - (game.startedAt || Date.now());
      game.turnState = 'GAME_OVER';
      return true;
    }

    const grantBonus = game.diceValue === 6 || (capturedPieceIds.length > 0 && game.settings.bonusTurnOnCapture);
    endTurn(game, grantBonus);
    return true;
  }

  return false;
}

export function validateGame(g) {
  if (!g || g.version !== 1 || !Array.isArray(g.players) || g.players.length < 2 || g.players.length > 4) {
    return false;
  }
  if (!['WAITING_FOR_ROLL', 'SELECTING_PIECE', 'GAME_OVER'].includes(g.turnState)) {
    return false;
  }
  if (!Number.isInteger(g.currentPlayerIndex) || !g.players[g.currentPlayerIndex] || !g.stats || !g.settings || !Array.isArray(g.rankings)) {
    return false;
  }
  g.settings = { ...DEFAULT_SETTINGS, ...g.settings };
  g.players.forEach(p => p.pieces.forEach(x => syncPieceState(x, g.settings)));
  return true;
}
