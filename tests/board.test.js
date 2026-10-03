import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLORS,
  OFFSETS,
  FINISH,
  getGlobalTile,
  isSafe,
  getPositionCoordinates,
  syncPieceState
} from '../src/lib/ludo/board.js';

test('board offsets per color', () => {
  assert.equal(OFFSETS.red, 0);
  assert.equal(OFFSETS.green, 13);
  assert.equal(OFFSETS.yellow, 26);
  assert.equal(OFFSETS.blue, 39);
});

test('getGlobalTile computes correct global track index', () => {
  assert.equal(getGlobalTile('red', 0), 0);
  assert.equal(getGlobalTile('green', 0), 13);
  assert.equal(getGlobalTile('yellow', 0), 26);
  assert.equal(getGlobalTile('blue', 0), 39);
  // Wraparound at 52 tiles
  assert.equal(getGlobalTile('blue', 14), (39 + 14) % 52); // 1
  assert.equal(getGlobalTile('red', 51), null); // In home path lane
});

test('isSafe detects star tiles and starting tiles', () => {
  assert.equal(isSafe(8), true);
  assert.equal(isSafe(21), true);
  assert.equal(isSafe(34), true);
  assert.equal(isSafe(47), true);
  assert.equal(isSafe(0, { safeStarts: true }), true);
  assert.equal(isSafe(13, { safeStarts: true }), true);
  assert.equal(isSafe(5, { safeStarts: true }), false);
});

test('getPositionCoordinates returns valid [row, col] grid positions', () => {
  const basePos = getPositionCoordinates('red', -1, 0);
  assert.equal(Array.isArray(basePos), true);
  assert.equal(basePos.length, 2);

  const startPos = getPositionCoordinates('red', 0, 0);
  assert.deepEqual(startPos, [6, 1]);

  const finishPos = getPositionCoordinates('red', FINISH, 0);
  assert.deepEqual(finishPos, [7, 7]);
});

test('syncPieceState updates piece state correctly', () => {
  const piece = { color: 'red', progress: -1 };
  syncPieceState(piece);
  assert.equal(piece.state, 'BASE');

  piece.progress = 10;
  syncPieceState(piece);
  assert.equal(piece.state, 'ACTIVE');

  piece.progress = 52;
  syncPieceState(piece);
  assert.equal(piece.state, 'HOME_PATH');
  assert.equal(piece.isSafe, true);

  piece.progress = FINISH;
  syncPieceState(piece);
  assert.equal(piece.state, 'FINISHED');
});
