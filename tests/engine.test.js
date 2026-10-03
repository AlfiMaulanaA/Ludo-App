import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch, getValidMoves } from '../src/lib/ludo/engine.js';
import { syncPieceState } from '../src/lib/ludo/board.js';

const setup = () => createGame([{ name: 'A', color: 'red', type: 'human' }, { name: 'B', color: 'green', type: 'human' }]);

test('base only exits on six', () => {
  const g = setup();
  dispatch(g, { type: 'ROLL_DICE', value: 5 });
  assert.equal(getValidMoves(g).length, 0);
  assert.equal(g.turnState, 'WAITING_FOR_ROLL');
  dispatch(g, { type: 'ROLL_DICE', value: 6 });
  assert.equal(getValidMoves(g).length, 4);
});

test('capture returns opponent to base', () => {
  const g = setup();
  const a = g.players[0].pieces[0];
  const b = g.players[1].pieces[0];
  a.progress = 10;
  b.progress = 50;
  syncPieceState(a, g.settings);
  syncPieceState(b, g.settings);
  g.diceValue = 1;
  g.turnState = 'SELECTING_PIECE';
  dispatch(g, { type: 'MOVE_PIECE', pieceId: a.id });
  assert.equal(b.progress, -1);
});

test('triple six ends turn', () => {
  const g = setup();
  for (let i = 0; i < 3; i++) {
    g.turnState = 'WAITING_FOR_ROLL';
    dispatch(g, { type: 'ROLL_DICE', value: 6 });
    if (i < 2) g.turnState = 'WAITING_FOR_ROLL';
  }
  assert.equal(g.currentPlayerIndex, 1);
});
