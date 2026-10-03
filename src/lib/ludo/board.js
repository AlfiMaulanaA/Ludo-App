export const COLORS = ['red', 'green', 'yellow', 'blue'];

export const COLOR_CODES = {
  red: '#e63946',
  green: '#2b9348',
  yellow: '#e9c46a',
  blue: '#1d3557'
};

export const LABELS = {
  red: 'Merah',
  green: 'Hijau',
  yellow: 'Kuning',
  blue: 'Biru'
};

export const SYMBOLS = {
  red: '◆',
  green: '♣',
  yellow: '☀',
  blue: '●'
};

export const OFFSETS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// 52 tiles main track on a 15x15 Ludo Board grid [row, col]
export const TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0]
];

// Private Home path lanes (5 tiles per color leading to center finish)
export const HOME = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Base slots for 4 pieces of each color. Fractional [row, col] = top-left of a 1x1 piece box,
// so slot centers land on (2,2) (2,4) (4,2) (4,4) within each 6x6 base yard.
export const BASE = {
  red: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  blue: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]]
};

// Where finished pieces rest (piece CENTER, in cell units) inside their own color's triangle.
// The 3x3 finish area spans cells 6..9, so its center is (7.5, 7.5).
export const FINISH_SPOT = {
  red: { center: [7.5, 6.8], spread: [1, 0] },
  green: { center: [6.8, 7.5], spread: [0, 1] },
  yellow: { center: [7.5, 8.2], spread: [1, 0] },
  blue: { center: [8.2, 7.5], spread: [0, 1] }
};

// Progress definitions:
// -1: BASE
// 0..50: 51 steps on global shared track
// 51..55: 5 steps on private home path lane
// 56: FINISH CENTER (7, 7)
export const FINISH = 56;

export function getGlobalTile(color, progress) {
  if (progress >= 0 && progress <= 50) {
    return (OFFSETS[color] + progress) % 52;
  }
  return null;
}

export function isSafe(tile, settings = {}) {
  if (tile === null) return false;
  // Star safe tiles (8, 21, 34, 47) + optional starting tiles (0, 13, 26, 39)
  const starTiles = [8, 21, 34, 47];
  const startTiles = [0, 13, 26, 39];
  return starTiles.includes(tile) || (settings.safeStarts !== false && startTiles.includes(tile));
}

export function getPositionCoordinates(color, progress, index = 0) {
  if (progress < 0) {
    return BASE[color][index];
  }
  if (progress <= 50) {
    const globalTile = getGlobalTile(color, progress);
    return TRACK[globalTile];
  }
  if (progress < FINISH) {
    return HOME[color][progress - 51];
  }
  // Center finish grid tile [7, 7]
  return [7, 7];
}

export function syncPieceState(piece, settings = {}) {
  if (piece.progress < 0) {
    piece.state = 'BASE';
  } else if (piece.progress === FINISH) {
    piece.state = 'FINISHED';
  } else if (piece.progress >= 51) {
    piece.state = 'HOME_PATH';
  } else {
    piece.state = 'ACTIVE';
  }
  piece.globalTileIndex = getGlobalTile(piece.color, piece.progress);
  piece.isSafe = piece.progress >= 51 || isSafe(piece.globalTileIndex, settings);
}
