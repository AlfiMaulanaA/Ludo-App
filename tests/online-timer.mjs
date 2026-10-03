// Verifies the server turn timer: an idle human gets auto-played, then replaced by a bot after 2 timeouts.
import { io } from 'socket.io-client';

const URL = process.env.URL || 'http://localhost:3100';
const a = io(URL), b = io(URL);
const emit = (s, ev, data) => new Promise(r => s.emit(ev, data, r));
const fail = m => { console.error('FAIL:', m); process.exit(1); };

await Promise.all([new Promise(r => a.on('connect', r)), new Promise(r => b.on('connect', r))]);
const created = await emit(a, 'CREATE_ROOM', { hostName: 'Andi', playerCount: 2, turnTimer: 10 });
await emit(b, 'JOIN_ROOM', { roomCode: created.roomCode, playerName: 'Budi' });

let rolls = 0, afkSeen = false, deadlineSeen = false;
a.on('GAME_UPDATED', d => { if (d.lastAction === 'ROLL_DICE') rolls++; });
a.on('PLAYER_LEFT', d => { if (d.reason === 'AFK') afkSeen = true; });
a.on('TURN_DEADLINE', () => (deadlineSeen = true));
await emit(a, 'START_GAME', {});

// Nobody acts: timeouts should auto-roll for the idle host and eventually convert them to a bot.
await new Promise(r => setTimeout(r, 32000));
if (!deadlineSeen) fail('no TURN_DEADLINE broadcast');
if (rolls < 2) fail(`expected auto rolls, got ${rolls}`);
if (!afkSeen) fail('host never taken over by bot after AFK');
console.log(`OK: timer works (auto rolls=${rolls}, afk takeover=${afkSeen})`);
process.exit(0);
