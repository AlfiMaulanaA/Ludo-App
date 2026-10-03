'use client';

import React from 'react';
import { LABELS } from '../lib/ludo/board';
import { User, Bot, Clock } from 'lucide-react';

export default function PlayerCard({
  player,
  isActive,
  isCurrentTurn,
  turnTimerSeconds = 0,
  maxTimerSeconds = 15,
  activeSpeechBubble = null
}) {
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
    red: 'ring-2 sm:ring-4 ring-rose-400/60 shadow-md scale-[1.01]',
    green: 'ring-2 sm:ring-4 ring-emerald-400/60 shadow-md scale-[1.01]',
    yellow: 'ring-2 sm:ring-4 ring-amber-400/60 shadow-md scale-[1.01]',
    blue: 'ring-2 sm:ring-4 ring-blue-400/60 shadow-md scale-[1.01]'
  };

  // Turn Timer color indicator
  const timerRatio = maxTimerSeconds > 0 ? turnTimerSeconds / maxTimerSeconds : 1;
  const timerColor =
    timerRatio > 0.5 ? 'bg-emerald-500 text-white' : timerRatio > 0.25 ? 'bg-amber-400 text-slate-950' : 'bg-rose-600 text-white animate-bounce';

  return (
    <div
      className={`relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 card ${
        cardAccents[player.color] || cardAccents.red
      } ${isActive ? activeGlows[player.color] : 'opacity-80'}`}
    >
      {/* Floating Speech Bubble / Sticker Reaction */}
      {activeSpeechBubble && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-xl bg-white border border-slate-300 shadow-lg font-display font-black text-[10px] sm:text-xs text-slate-800 whitespace-nowrap animate-pop-in flex items-center gap-1 scale-90">
          <span>{activeSpeechBubble}</span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-slate-300 rotate-45" />
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Avatar */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-display font-bold text-white shadow-sm shrink-0 ${
            badgeBgs[player.color]
          }`}
        >
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Player Name & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-display font-extrabold truncate text-slate-900 leading-tight">
              {player.name}
            </span>
            {player.rank && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-300 text-slate-900 shadow-xs shrink-0">
                #{player.rank}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-0.5">
            <span className="truncate">{LABELS[player.color]}</span>
            <span className="font-black text-slate-700 shrink-0">{finishedCount}/4</span>
          </div>
        </div>

        {/* Turn timer countdown badge */}
        {isActive && turnTimerSeconds > 0 && (
          <div className={`px-1.5 sm:px-2 py-0.5 rounded-full ${timerColor} text-[10px] sm:text-xs font-display font-black shadow-sm flex items-center gap-0.5 shrink-0`}>
            <Clock className="w-3 h-3" />
            <span>{turnTimerSeconds}s</span>
          </div>
        )}
      </div>

      {/* Finished Progress Bar */}
      <div className="mt-1.5 w-full bg-slate-200/90 h-1 sm:h-1.5 rounded-full overflow-hidden border border-white/60">
        <div
          style={{ width: `${(finishedCount / 4) * 100}%` }}
          className={`h-full transition-all duration-300 ${badgeBgs[player.color]}`}
        />
      </div>
    </div>
  );
}
