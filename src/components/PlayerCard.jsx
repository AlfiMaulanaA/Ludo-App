'use client';

import React from 'react';
import { LABELS, SYMBOLS } from '../lib/ludo/board';
import { User, Bot } from 'lucide-react';

export default function PlayerCard({ player, isActive, isCurrentTurn, turnTimerSeconds = 0 }) {
  if (!player) return null;

  const finishedCount = player.pieces ? player.pieces.filter(p => p.progress === 56).length : 0;
  const isBot = player.type === 'bot';

  const cardAccents = {
    red: 'border-rose-200 bg-rose-50/90 text-rose-950',
    green: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    yellow: 'border-amber-200 bg-amber-50/90 text-amber-950',
    blue: 'border-blue-200 bg-blue-50/90 text-blue-950'
  };

  const badgeBgs = {
    red: 'bg-rose-500 text-white',
    green: 'bg-emerald-500 text-white',
    yellow: 'bg-amber-400 text-slate-950',
    blue: 'bg-blue-500 text-white'
  };

  const activeGlows = {
    red: 'ring-4 ring-rose-400/50 shadow-lg scale-[1.02]',
    green: 'ring-4 ring-emerald-400/50 shadow-lg scale-[1.02]',
    yellow: 'ring-4 ring-amber-400/50 shadow-lg scale-[1.02]',
    blue: 'ring-4 ring-blue-400/50 shadow-lg scale-[1.02]'
  };

  return (
    <div
      className={`relative p-3 rounded-2xl border-2 transition-all duration-300 card ${
        cardAccents[player.color] || cardAccents.red
      } ${isActive ? activeGlows[player.color] : 'opacity-85'}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-white shadow-md ${
            badgeBgs[player.color]
          }`}
        >
          {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>

        {/* Player Name & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-display font-extrabold truncate text-slate-800">{player.name}</span>
            {player.rank && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-300 text-slate-900 shadow-sm">
                #{player.rank}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{LABELS[player.color]}</span>
            <span>•</span>
            <span className="font-bold text-slate-700">{finishedCount}/4 Finish</span>
          </div>
        </div>

        {/* Turn timer countdown badge */}
        {isActive && turnTimerSeconds > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-display font-black shadow-md animate-pulse">
            {turnTimerSeconds}s
          </div>
        )}
      </div>

      {/* Finished Progress Bar */}
      <div className="mt-2.5 w-full bg-slate-200/80 h-2 rounded-full overflow-hidden border border-white">
        <div
          style={{ width: `${(finishedCount / 4) * 100}%` }}
          className={`h-full transition-all duration-300 ${badgeBgs[player.color]}`}
        />
      </div>
    </div>
  );
}
