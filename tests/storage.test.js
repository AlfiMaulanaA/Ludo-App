import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGame } from '../src/lib/ludo/engine.js';
import { getEmptyStats, recordGameStats } from '../src/lib/ludo/storage.js';

test('getEmptyStats returns initial statistics object structure', () => {
  const stats = getEmptyStats();
  assert.equal(stats.games, 0);
  assert.equal(stats.wins, 0);
  assert.equal(stats.captures, 0);
  assert.equal(Array.isArray(stats.recorded), true);
});

test('validateGame verifies game structure integrity', () => {
  const invalidGame = { version: 999 };
  assert.equal(validateGame(invalidGame), false);
  assert.equal(validateGame(null), false);
});
