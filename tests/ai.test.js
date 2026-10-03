import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/lib/ludo/engine.js';
import { chooseMove, scoreMove } from '../src/lib/ludo/ai.js';
import { syncPieceState } from '../src/lib/ludo/board.js';

test('chooseMove selects valid piece for bot', () => {
  const g = createGame([
    { name: 'Bot 1', color: 'red', type: 'bot', botDifficulty: 'medium' },
    { name: 'Bot 2', color: 'green', type: 'bot', botDifficulty: 'hard' }
  ]);

  dispatch(g, { type: 'ROLL_DICE', value: 6 });
  const choice = chooseMove(g, 'hard');

  assert.notEqual(choice, null);
  assert.equal(choice.playerId, 'p0');
  assert.equal(choice.progress, -1); // Valid base piece
});

test('bot scoreMove prioritizes capture over passive move', () => {
  const g = createGame([
    { name: 'Bot 1', color: 'red', type: 'bot' },
    { name: 'Bot 2', color: 'green', type: 'bot' }
  ]);

  const p1 = g.players[0].pieces[0]; // Normal move
  const p2 = g.players[0].pieces[1]; // Capture move

  p1.progress = 5;
  p2.progress = 10; // Lands on global tile 11 with dice 1, where enemy is!

  const enemy = g.players[1].pieces[0];
  enemy.progress = 50; // Also lands on global tile 11

  syncPieceState(p1, g.settings);
  syncPieceState(p2, g.settings);
  syncPieceState(enemy, g.settings);

  g.diceValue = 1;
  const scorePassive = scoreMove(g, p1);
  const scoreCapture = scoreMove(g, p2);

  assert.equal(scoreCapture > scorePassive, true);
});
