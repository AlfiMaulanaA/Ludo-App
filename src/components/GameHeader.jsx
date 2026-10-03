import React, { useState } from 'react';
import { Pause, Volume2, VolumeX, MessageSquare, Smile, Copy, LogOut } from 'lucide-react';
import { copyToClipboard } from '../lib/ludo/clipboard';

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
  const [copiedNotice, setCopiedNotice] = useState('');
  const activePlayer = game?.players?.[game?.currentPlayerIndex];

  const copyRoomCode = async () => {
    if (roomCode) {
      const ok = await copyToClipboard(roomCode);
      setCopiedNotice(ok ? `Kode ${roomCode} disalin!` : 'Gagal menyalin kode');
      setTimeout(() => setCopiedNotice(''), 2500);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 px-2.5 sm:px-4 py-2 sm:py-3 card mb-2 sm:mb-4 relative">
      {copiedNotice && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-display font-black rounded-full shadow-md z-50 animate-fade-in">
          {copiedNotice}
        </div>
      )}

      {/* Left: App Logo / Exit / Room Code */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onBackToMenu}
          className="icon-btn hover:border-rose-300 hover:bg-rose-50 text-rose-600 p-1.5 sm:p-2"
          title="Keluar Permainan"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
        </button>

        {roomCode ? (
          <div
            onClick={copyRoomCode}
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-all shadow-xs"
            title="Klik untuk salin kode room"
          >
            <span className="text-[9px] sm:text-[10px] uppercase font-display font-black text-purple-600">Room:</span>
            <span className="text-xs sm:text-sm font-display font-black text-slate-800 tracking-wider">{roomCode}</span>
            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 ml-0.5" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <img src="/app-logo.jpeg" alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl object-cover border border-purple-200 shadow-xs" />
            <span className="text-base sm:text-xl font-display font-black text-purple-600 tracking-tight">
              LUDO <span className="text-amber-500">APP</span>
            </span>
          </div>
        )}
      </div>

      {/* Middle: Active turn indicator banner (Desktop & Tablet only to avoid mobile overlap) */}
      {activePlayer && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full chip border border-slate-200 shadow-xs">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-ping ${
              activePlayer.color === 'red'
                ? 'bg-rose-500'
                : activePlayer.color === 'green'
                ? 'bg-emerald-500'
                : activePlayer.color === 'yellow'
                ? 'bg-amber-400'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-xs font-display font-bold text-slate-700 truncate max-w-[140px]">
            Giliran: <span className="font-extrabold text-slate-900">{activePlayer.name}</span>
          </span>
        </div>
      )}

      {/* Right: Action icons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onOpenEmotes && (
          <button
            type="button"
            onClick={onOpenEmotes}
            className="icon-btn text-amber-500 hover:text-amber-600 p-1.5 sm:p-2"
            title="Kirim Emote"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="icon-btn text-purple-600 hover:text-purple-700 p-1.5 sm:p-2"
            title="Obrolan Room"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMute}
          className="icon-btn p-1.5 sm:p-2"
          title={isMuted ? 'Unmute' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
        </button>

        <button
          type="button"
          onClick={onPauseClick}
          className="icon-btn p-1.5 sm:p-2"
          title="Pause Menu"
        >
          <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </button>

        <button
          type="button"
          onClick={onBackToMenu}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-display font-black flex items-center gap-1 hover:bg-rose-100 transition-colors"
          title="Keluar Permainan"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Keluar Game</span>
        </button>
      </div>
    </header>
  );
}
