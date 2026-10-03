'use client';

import React from 'react';
import { Pause, Volume2, VolumeX, MessageSquare, Smile, Copy, ArrowLeft, LogOut } from 'lucide-react';

export default function GameHeader({
  game,
  onPauseClick,
  onToggleMute,
  isMuted = false,
  roomCode = null,
  onOpenChat,
  onOpenEmotes,
  onBackToMenu
}) {
  const activePlayer = game?.players?.[game?.currentPlayerIndex];

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      alert(`Kode Ruangan ${roomCode} berhasil disalin!`);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 py-3 card mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="icon-btn hover:border-rose-300 hover:bg-rose-50 text-rose-600"
          title="Keluar Permainan (Exit Game)"
        >
          <LogOut className="w-5 h-5 text-rose-600" />
        </button>

        {roomCode ? (
          <div
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-purple-50 border-2 border-purple-200 cursor-pointer hover:bg-purple-100 transition-all shadow-sm"
            title="Klik untuk salin kode room"
          >
            <span className="text-[10px] uppercase font-display font-black text-purple-600">Room:</span>
            <span className="text-sm font-display font-black text-slate-800 tracking-wider">{roomCode}</span>
            <Copy className="w-3.5 h-3.5 text-purple-600 ml-0.5" />
          </div>
        ) : (
          <span className="text-xl font-display font-black text-purple-600 tracking-tight">
            LUDO <span className="text-amber-500">APP</span>
          </span>
        )}
      </div>

      {/* Active turn indicator banner */}
      {activePlayer && (
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full chip border-2 border-slate-200 shadow-sm turn-banner">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              activePlayer.color === 'red'
                ? 'bg-rose-500'
                : activePlayer.color === 'green'
                ? 'bg-emerald-500'
                : activePlayer.color === 'yellow'
                ? 'bg-amber-400'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-xs font-display font-bold text-slate-700 truncate max-w-[150px]">
            Giliran: <span className="font-extrabold text-slate-900">{activePlayer.name}</span>
          </span>
        </div>
      )}

      {/* Action icons */}
      <div className="flex items-center gap-2">
        {onOpenEmotes && (
          <button
            type="button"
            onClick={onOpenEmotes}
            className="icon-btn text-amber-500 hover:text-amber-600"
            title="Kirim Emote"
          >
            <Smile className="w-5 h-5" />
          </button>
        )}

        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="icon-btn text-purple-600 hover:text-purple-700"
            title="Obrolan Room"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMute}
          className="icon-btn"
          title={isMuted ? 'Unmute' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
        </button>

        <button
          type="button"
          onClick={onPauseClick}
          className="icon-btn"
          title="Pause Menu"
        >
          <Pause className="w-5 h-5 text-slate-700" />
        </button>

        <button
          type="button"
          onClick={onBackToMenu}
          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-display font-black flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
          title="Keluar Permainan"
        >
          <LogOut className="w-4 h-4" /> Keluar Game
        </button>
      </div>
    </header>
  );
}
