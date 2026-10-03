'use client';

import React from 'react';
import { LABELS, SYMBOLS } from '../lib/ludo/board';
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
    red: 'ring-4 ring-rose-400/50 shadow-lg scale-[1.02]',
    green: 'ring-4 ring-emerald-400/50 shadow-lg scale-[1.02]',
    yellow: 'ring-4 ring-amber-400/50 shadow-lg scale-[1.02]',
    blue: 'ring-4 ring-blue-400/50 shadow-lg scale-[1.02]'
  };

  // Turn Timer color indicator
  const timerRatio = maxTimerSeconds > 0 ? turnTimerSeconds / maxTimerSeconds : 1;
  const timerColor =
    timerRatio > 0.5 ? 'bg-emerald-500 text-white' : timerRatio > 0.25 ? 'bg-amber-400 text-slate-950' : 'bg-rose-600 text-white animate-bounce';

  return (
    <div
      className={`relative p-3 rounded-2xl border-2 transition-all duration-300 card ${
        cardAccents[player.color] || cardAccents.red
      } ${isActive ? activeGlows[player.color] : 'opacity-85'}`}
    >
      {/* Floating Speech Bubble / Sticker Reaction */}
      {activeSpeechBubble && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xl font-display font-black text-xs text-slate-800 whitespace-nowrap animate-pop-in flex items-center gap-1">
          <span>{activeSpeechBubble}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-slate-200 rotate-45" />
        </div>
      )}

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
          <div className={`px-2.5 py-1 rounded-full ${timerColor} text-xs font-display font-black shadow-md flex items-center gap-1`}>
            <Clock className="w-3 h-3" />
            <span>{turnTimerSeconds}s</span>
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
