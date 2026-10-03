'use client';

import React, { useState } from 'react';
import { Dices, Lock } from 'lucide-react';

const PIP_POSITIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [28, 72], [72, 28], [72, 72]],
  5: [[28, 28], [28, 72], [50, 50], [72, 28], [72, 72]],
  6: [[28, 24], [28, 50], [28, 76], [72, 24], [72, 50], [72, 76]]
};

const COLOR_PIPS = {
  red: '#ff4d6d',
  green: '#22c55e',
  yellow: '#e0a000',
  blue: '#3b82f6'
};

export default function DiceRoller({
  diceValue,
  turnState,
  isMyTurn,
  onRollDice,
  activeColor = 'red',
  activePlayerName = '',
  activePlayerType = 'human'
}) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (!isMyTurn || turnState !== 'WAITING_FOR_ROLL' || isRolling) return;
    setIsRolling(true);
    onRollDice && onRollDice();
    setTimeout(() => setIsRolling(false), 500);
  };

  const pips = PIP_POSITIONS[diceValue] || PIP_POSITIONS[1];
  const canRoll = isMyTurn && turnState === 'WAITING_FOR_ROLL';

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 select-none">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          disabled={!canRoll}
          onClick={handleRoll}
          aria-label={canRoll ? 'Lempar dadu' : 'Dadu terkunci - Bukan giliran kamu'}
          className={`die ${canRoll ? 'ready cursor-pointer ring-4 ring-purple-400/40 shadow-lg' : 'disabled'} ${
            isRolling ? 'rolling' : ''
          }`}
          style={{ '--pip': COLOR_PIPS[activeColor] || '#1e293b' }}
        >
          {diceValue ? (
            <div className="relative w-full h-full">
              {pips.map(([cx, cy], i) => (
                <span
                  key={i}
                  className="pip"
                  style={{ top: `${cy}%`, left: `${cx}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dices className="w-8 h-8 text-slate-400 animate-spin-slow" />
            </div>
          )}
        </button>

        {/* Lock overlay icon when it's NOT my turn */}
        {!isMyTurn && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center shadow-md border border-slate-600 z-10"
            title="Bukan giliran kamu"
          >
            <Lock className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Clear status badge below dice */}
      <div className="text-center h-5 flex items-center justify-center">
        {canRoll && (
          <span className="text-[11px] sm:text-xs font-display font-black text-purple-600 uppercase tracking-wider animate-bounce block">
            🎲 Lempar Dadu!
          </span>
        )}
        {turnState === 'SELECTING_PIECE' && isMyTurn && (
          <span className="text-[11px] sm:text-xs font-display font-black text-emerald-600 uppercase tracking-wider block">
            👉 Pilih Bidak!
          </span>
        )}
        {!isMyTurn && (
          <span className="text-[10px] sm:text-xs font-display font-bold text-slate-600 bg-slate-100/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-200 block truncate max-w-[210px] shadow-sm">
            {activePlayerType === 'bot' ? (
              <span className="text-amber-700 flex items-center gap-1 justify-center">🤖 Bot ({activePlayerName}) bermain...</span>
            ) : (
              <span>⏳ Menunggu {activePlayerName || 'Lawan'}...</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
