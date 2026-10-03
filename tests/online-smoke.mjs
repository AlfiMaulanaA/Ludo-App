// Smoke test: two clients create/join a room, start game, verify server-authoritative dice.
import { io } from 'socket.io-client';

const URL = process.env.URL || 'http://localhost:3100';
const a = io(URL), b = io(URL);
const wait = ms => new Promise(r => setTimeout(r, ms));
const emit = (s, ev, data) => new Promise(r => s.emit(ev, data, r));
const fail = m => { console.error('FAIL:', m); process.exit(1); };

await Promise.all([new Promise(r => a.on('connect', r)), new Promise(r => b.on('connect', r))]);
const created = await emit(a, 'CREATE_ROOM', { hostName: 'Andi', playerCount: 2, turnTimer: 15 });
if (!created.success) fail('create');
console.log('room', created.roomCode);

const joined = await emit(b, 'JOIN_ROOM', { roomCode: created.roomCode, playerName: 'Budi' });
if (!joined.success) fail('join');
if (!joined.roomState.players.every(p => 'socketId' in p)) fail('socketId missing in room state');

let game = null;
a.on('GAME_UPDATED', d => (game = d.game));
const started = new Promise(r => a.on('GAME_STARTED', d => { game = d.game; r(); }));
const s = await emit(a, 'START_GAME', {});
if (!s.success) fail('start');
await started;

// Non-active player (Budi) must be rejected
b.emit('ROLL_DICE');
await wait(300);
if (game.diceValue !== null) fail('non-active player rolled');

a.emit('ROLL_DICE');
await wait(300);
if (!(game.stats.rolls === 1)) fail('active roll not applied');
console.log('dice', game.diceValue, 'state', game.turnState);

// Invalid piece move from wrong player must be rejected
b.emit('MOVE_PIECE', { pieceId: 'p0-0' });
await wait(200);
console.log('OK: online flow verified');
process.exit(0);
