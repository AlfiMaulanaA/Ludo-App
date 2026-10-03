import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  dispatch,
  canPieceMove,
  getValidMoves,
  getCurrentPlayer
} from '../src/lib/ludo/engine.js';
import { syncPieceState, FINISH } from '../src/lib/ludo/board.js';

const setup2Player = () =>
  createGame([
    { name: 'Alice', color: 'red', type: 'human' },
    { name: 'Bob', color: 'green', type: 'human' }
  ]);

test('createGame initializes 4 pieces per player with default settings', () => {
  const g = setup2Player();
  assert.equal(g.players.length, 2);
  assert.equal(g.players[0].pieces.length, 4);
  assert.equal(g.players[1].pieces.length, 4);
  assert.equal(g.currentPlayerIndex, 0);
  assert.equal(g.turnState, 'WAITING_FOR_ROLL');
});

test('piece in BASE only exits on a 6 roll', () => {
  const g = setup2Player();
  dispatch(g, { type: 'ROLL_DICE', value: 5 });
  assert.equal(getValidMoves(g).length, 0);
  assert.equal(g.turnState, 'WAITING_FOR_ROLL'); // Auto-ended turn on no moves

  // Next player's turn
  assert.equal(g.currentPlayerIndex, 1);
  dispatch(g, { type: 'ROLL_DICE', value: 6 });
  assert.equal(getValidMoves(g).length, 4);
});

test('exact roll required to enter FINISH', () => {
  const g = setup2Player();
  const piece = g.players[0].pieces[0];
  piece.progress = 54; // Needs exact roll 2 to reach 56 FINISH
  syncPieceState(piece, g.settings);

  // Roll 3 exceeds FINISH -> illegal move
  assert.equal(canPieceMove(g, piece, 3), false);
  // Roll 2 reaches FINISH -> valid move
  assert.equal(canPieceMove(g, piece, 2), true);
});

test('capture sends enemy piece back to BASE', () => {
  const g = setup2Player();
  const a = g.players[0].pieces[0];
  const b = g.players[1].pieces[0];

  a.progress = 10;
  b.progress = 50; // Both resolve to global tile 10
  syncPieceState(a, g.settings);
  syncPieceState(b, g.settings);

  g.diceValue = 1;
  g.turnState = 'SELECTING_PIECE';
  const ok = dispatch(g, { type: 'MOVE_PIECE', pieceId: a.id });

  assert.equal(ok, true);
  assert.equal(b.progress, -1); // Captured back to BASE
  assert.equal(b.state, 'BASE');
});

test('triple six roll triggers end turn', () => {
  const g = setup2Player();
  for (let i = 0; i < 3; i++) {
    g.turnState = 'WAITING_FOR_ROLL';
    dispatch(g, { type: 'ROLL_DICE', value: 6 });
  }
  // Turn ends and passes to player index 1
  assert.equal(g.currentPlayerIndex, 1);
});

test('winner detection updates ranking when all pieces reach FINISH', () => {
  const g = setup2Player();
  const p0 = g.players[0];

  // Move all 4 pieces of player 0 to 55 (1 step away from FINISH)
  p0.pieces.forEach(p => {
    p.progress = 55;
    syncPieceState(p, g.settings);
  });

  // Finish 3 pieces
  for (let i = 0; i < 3; i++) {
    g.turnState = 'SELECTING_PIECE';
    g.diceValue = 1;
    dispatch(g, { type: 'MOVE_PIECE', pieceId: p0.pieces[i].id });
    g.currentPlayerIndex = 0; // Keep turn for test
  }

  // Finish 4th piece -> Victory
  g.turnState = 'SELECTING_PIECE';
  g.diceValue = 1;
  dispatch(g, { type: 'MOVE_PIECE', pieceId: p0.pieces[3].id });

  assert.equal(p0.isFinished, true);
  assert.equal(g.rankings[0], p0.id);
  assert.equal(g.turnState, 'GAME_OVER');
});
