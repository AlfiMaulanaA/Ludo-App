'use client';

import React, { useState } from 'react';
import { Dices } from 'lucide-react';

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

export default function DiceRoller({ diceValue, turnState, isMyTurn, onRollDice, activeColor = 'red' }) {
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
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      <button
        type="button"
        disabled={!canRoll}
        onClick={handleRoll}
        aria-label={canRoll ? 'Lempar dadu' : 'Dadu'}
        className={`die ${canRoll ? 'ready cursor-pointer' : 'opacity-85'} ${isRolling ? 'rolling' : ''}`}
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
            <Dices className="w-9 h-9 text-slate-400 animate-spin-slow" />
          </div>
        )}
      </button>

      <div className="text-center h-5">
        {canRoll && (
          <span className="text-xs font-display font-bold text-purple-600 uppercase tracking-wider animate-bounce block">
            Lempar Dadu!
          </span>
        )}
        {turnState === 'SELECTING_PIECE' && isMyTurn && (
          <span className="text-xs font-display font-bold text-emerald-600 uppercase tracking-wider block">
            Pilih Bidak!
          </span>
        )}
      </div>
    </div>
  );
}
