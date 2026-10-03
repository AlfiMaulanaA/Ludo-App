import { validateGame } from './engine.js';

const PREFIX = 'ludo-next-v1-';

export function readStorage(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSavedGame() {
  const game = readStorage('game');
  try {
    return validateGame(game) ? game : null;
  } catch {
    return null;
  }
}

export function saveGame(game) {
  return writeStorage('game', game);
}

export function clearSavedGame() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFIX + 'game');
  } catch {}
}

export const getEmptyStats = () => ({
  games: 0,
  wins: 0,
  captures: 0,
  rolls: 0,
  sixes: 0,
  finished: 0,
  fastest: null,
  perfect: 0,
  modes: { local: { games: 0, wins: 0 }, bot: { games: 0, wins: 0 }, online: { games: 0, wins: 0 } },
  recorded: []
});

export function recordGameStats(game) {
  const stats = readStorage('stats', getEmptyStats());
  if (stats.recorded.includes(game.id)) return stats;

  const humanIndices = game.players
    .map((p, i) => (p.type === 'human' ? i : -1))
    .filter(i => i >= 0);

  const winner = game.players.find(p => p.id === game.rankings[0]);
  const won = winner && winner.type === 'human';

  stats.games++;
  if (won) {
    stats.wins++;
    stats.fastest = stats.fastest === null ? game.elapsedMs : Math.min(stats.fastest, game.elapsedMs);
    const winnerIdx = game.players.indexOf(winner);
    if (winnerIdx >= 0 && game.stats.byPlayer[winnerIdx].captured === 0) {
      stats.perfect++;
    }
  }

  for (const idx of humanIndices) {
    const pStats = game.stats.byPlayer[idx];
    if (pStats) {
      for (const key of ['captures', 'rolls', 'sixes', 'finished']) {
        stats[key] = (stats[key] || 0) + (pStats[key] || 0);
      }
    }
  }

  const isOnline = game.isOnlineMode === true;
  const isBot = game.players.some(p => p.type === 'bot');
  const modeKey = isOnline ? 'online' : isBot ? 'bot' : 'local';

  stats.modes[modeKey] = stats.modes[modeKey] || { games: 0, wins: 0 };
  stats.modes[modeKey].games++;
  if (won) stats.modes[modeKey].wins++;

  stats.recorded.push(game.id);
  writeStorage('stats', stats);
  return stats;
}
