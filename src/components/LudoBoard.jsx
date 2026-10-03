'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, ChevronRight, Crown } from 'lucide-react';
import { COLORS, LABELS, SYMBOLS, TRACK, HOME, BASE, OFFSETS, FINISH, FINISH_SPOT, getPositionCoordinates, isSafe } from '../lib/ludo/board';

const TONE = { red: '#ff4d6d', green: '#22c55e', yellow: '#ffc312', blue: '#3b82f6' };
const YARD_POS = {
  red: { top: 0, left: 0 },
  green: { top: 0, right: 0 },
  yellow: { bottom: 0, right: 0 },
  blue: { bottom: 0, left: 0 }
};
const EMOTE_POS = { red: ['20%', '20%'], green: ['80%', '20%'], yellow: ['80%', '80%'], blue: ['20%', '80%'] };
const START_ARROW_DEG = { red: 0, green: 90, yellow: 180, blue: 270 };

// Static cell map of the cross-shaped track (computed once)
const CELLS = (() => {
  const trackIdx = new Map(TRACK.map(([r, c], i) => [`${r},${c}`, i]));
  const homeMap = new Map();
  Object.entries(HOME).forEach(([color, path]) => path.forEach(([r, c], i) => homeMap.set(`${r},${c}`, { color, i })));
  const out = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const inYard = (r < 6 || r > 8) && (c < 6 || c > 8);
      const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      if (inYard || inCenter) continue;
      out.push({ r, c, track: trackIdx.get(`${r},${c}`), home: homeMap.get(`${r},${c}`) });
    }
  }
  return out;
})();

const snapshot = game => {
  const map = {};
  game.players.forEach(p => p.pieces.forEach(pc => (map[pc.id] = pc.progress)));
  return map;
};

/**
 * Walks each piece tile-by-tile toward its logical progress. Captured pieces return to base only
 * after the capturing piece has finished walking, so the capture reads clearly.
 */
function usePieceAnimation(game, stepMs, onStep, onBusyChange) {
  const [display, setDisplay] = useState(() => snapshot(game));
  const [popped, setPopped] = useState({});
  const displayRef = useRef(display);
  const targetRef = useRef(display);
  const idRef = useRef(game.id);
  const timerRef = useRef(null);
  const busyRef = useRef(false);
  const stepMsRef = useRef(stepMs);
  const cbs = useRef({});
  stepMsRef.current = stepMs;
  cbs.current = { onStep, onBusyChange };

  const setBusy = value => {
    if (busyRef.current !== value) {
      busyRef.current = value;
      cbs.current.onBusyChange?.(value);
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const tick = () => {
    const cur = { ...displayRef.current };
    const target = targetRef.current;
    let moved = false;
    let forward = false;
    for (const id in target) {
      const d = cur[id] ?? -1;
      if (target[id] > d) {
        cur[id] = d + 1;
        moved = true;
        forward = true;
      }
    }
    const justPopped = [];
    if (!forward) {
      for (const id in target) {
        if (target[id] < cur[id]) {
          cur[id] = target[id];
          moved = true;
          if (target[id] === -1) justPopped.push(id);
        }
      }
    }
    if (!moved) {
      stop();
      setBusy(false);
      return;
    }
    displayRef.current = cur;
    setDisplay(cur);
    if (forward) cbs.current.onStep?.();
    if (justPopped.length) {
      const flags = Object.fromEntries(justPopped.map(id => [id, true]));
      setPopped(p => ({ ...p, ...flags }));
      setTimeout(() => setPopped(p => {
        const next = { ...p };
        justPopped.forEach(id => delete next[id]);
        return next;
      }), 700);
    }
  };

  useEffect(() => {
    const target = snapshot(game);
    targetRef.current = target;
    if (idRef.current !== game.id || stepMsRef.current <= 0) {
      idRef.current = game.id;
      stop();
      displayRef.current = target;
      setDisplay(target);
      setBusy(false);
      return;
    }
    const differs = Object.keys(target).some(id => target[id] !== displayRef.current[id]);
    if (differs && !timerRef.current) {
      setBusy(true);
      timerRef.current = setInterval(tick, stepMsRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return { display, popped };
}

export default function LudoBoard({
  game,
  validMovePieceIds = [],
  onPieceClick,
  floatingEmotes = [],
  activeColor = null,
  stepMs = 150,
  onStep,
  onBusyChange
}) {
  const { display, popped } = usePieceAnimation(game, stepMs, onStep, onBusyChange);

  // Place every piece, grouping pieces that share a tile so they fan out instead of overlapping.
  const placed = useMemo(() => {
    const list = [];
    const groups = new Map();
    game.players.forEach(player =>
      player.pieces.forEach((piece, idx) => {
        const progress = display[piece.id] ?? piece.progress;
        const finished = progress === FINISH;
        let row;
        let col;
        let key;
        if (finished) {
          key = `fin-${player.color}`;
          [row, col] = FINISH_SPOT[player.color].center;
        } else {
          [row, col] = getPositionCoordinates(player.color, progress, idx);
          key = `${row},${col}`;
        }
        const item = { piece, player, idx, progress, finished, row, col, key };
        list.push(item);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      })
    );
    list.forEach(item => {
      const group = groups.get(item.key);
      item.order = group.indexOf(item);
      item.count = group.length;
    });
    return list;
  }, [game, display]);

  const legal = new Set(validMovePieceIds);

  return (
    <div className="board select-none" role="group" aria-label="Papan Ludo">
      {/* Yards */}
      {COLORS.map(color => (
        <div
          key={color}
          className={`yard ${activeColor === color ? 'active' : ''}`}
          style={{ ...YARD_POS[color], background: TONE[color], borderRadius: color === 'red' ? '0 0 28% 0' : color === 'green' ? '0 0 0 28%' : color === 'yellow' ? '28% 0 0 0' : '0 28% 0 0' }}
        >
          <div className="yard-inner" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-bold opacity-[0.07] text-slate-900"
            style={{ fontSize: 'clamp(2rem, 11vw, 4.5rem)' }}
          >
            {SYMBOLS[color]}
          </span>
        </div>
      ))}
      {/* Base slots (aligned exactly with piece base coordinates) */}
      {COLORS.flatMap(color =>
        BASE[color].map(([r, c], i) => (
          <span
            key={`${color}-slot-${i}`}
            className="slot"
            style={{ '--tone': TONE[color], top: `${((r + 0.5) / 15) * 100}%`, left: `${((c + 0.5) / 15) * 100}%` }}
          />
        ))
      )}

      {/* Track grid */}
      <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>
        {CELLS.map(({ r, c, track, home }) => {
          const startColor = track !== undefined ? COLORS.find(col => OFFSETS[col] === track) : null;
          const star = track !== undefined && !startColor && isSafe(track, game.settings);
          const style = { gridRow: r + 1, gridColumn: c + 1 };
          let cls = 'tile';
          if (home) {
            cls += ' lane';
            style.background = TONE[home.color];
          } else if (startColor) {
            cls += ' start';
            style.background = TONE[startColor];
          } else if (star) cls += ' safe-star';
          return (
            <div key={`${r}-${c}`} className={cls} style={style}>
              {startColor && (
                <ChevronRight className="w-[70%] h-[70%]" strokeWidth={3.5} style={{ transform: `rotate(${START_ARROW_DEG[startColor]}deg)` }} />
              )}
              {star && <Star className="w-[62%] h-[62%] text-amber-400 fill-amber-300" strokeWidth={2} />}
              {home && home.i === 4 && (
                <ChevronRight className="w-[60%] h-[60%] text-white/80" strokeWidth={3.5} style={{ transform: `rotate(${START_ARROW_DEG[home.color]}deg)` }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Center finish */}
      <div className="center-pie" aria-label="Area finish">
        <i style={{ background: TONE.red, clipPath: 'polygon(0 0, 50% 50%, 0 100%)' }} />
        <i style={{ background: TONE.green, clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }} />
        <i style={{ background: TONE.yellow, clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }} />
        <i style={{ background: TONE.blue, clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }} />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[34%] h-[34%] rounded-full bg-white shadow-md flex items-center justify-center">
          <Crown className="w-[70%] h-[70%] text-amber-400 fill-amber-300" />
        </span>
      </div>

      {/* Pieces */}
      {placed.map(({ piece, player, idx, progress, finished, row, col, order, count }) => {
        const isLegal = legal.has(piece.id);
        const fanned = count > 1 && !finished;
        const dx = fanned ? ((order % 2) - 0.5) * 38 : 0;
        const dy = fanned ? (Math.floor(order / 2) - (Math.ceil(count / 2) - 1) / 2) * 32 : 0;
        let top = row;
        let left = col;
        let scale = fanned ? Math.max(0.58, 1 - count * 0.1) : 1;
        if (finished) {
          const spot = FINISH_SPOT[player.color];
          const spreadIdx = order - (count - 1) / 2;
          top = row - 0.5 + spot.spread[0] * spreadIdx * 0.32;
          left = col - 0.5 + spot.spread[1] * spreadIdx * 0.32;
          scale = 0.5;
        }
        const label = `${player.name}, bidak ${idx + 1}, ${progress < 0 ? 'di base' : finished ? 'selesai' : `langkah ${progress}`}${isLegal ? ', bisa digerakkan' : ''}`;
        return (
          <button
            key={piece.id}
            type="button"
            disabled={!isLegal}
            onClick={() => onPieceClick?.(piece.id)}
            aria-label={label}
            title={label}
            className={`piece p-${player.color} ${isLegal ? 'legal' : ''} ${finished ? 'finished' : ''} ${popped[piece.id] ? 'popped' : ''}`}
            style={{
              top: `${(top / 15) * 100}%`,
              left: `${(left / 15) * 100}%`,
              '--dx': `${dx}%`,
              '--dy': `${dy}%`,
              '--sc': scale,
              '--step': `${Math.max(60, stepMs - 10) / 1000}s`,
              zIndex: isLegal ? 60 : 20 + order + (progress >= 0 ? 5 : 0)
            }}
          >
            <span className="pin">{idx + 1}</span>
          </button>
        );
      })}

      {/* Emote reactions float above the sender's yard */}
      {floatingEmotes.map(item => {
        const color = game.players.find(p => p.id === item.playerId)?.color || activeColor || 'red';
        const [top, left] = EMOTE_POS[color];
        return (
          <div key={item.id} className="absolute text-5xl pointer-events-none z-[70] animate-float-emote drop-shadow-lg" style={{ top, left }}>
            {item.emote}
          </div>
        );
      })}
    </div>
  );
}
