'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Play, RotateCcw, Home, Trophy, Award, Settings as SettingsIcon, HelpCircle, BarChart3, Check } from 'lucide-react';

/* PAUSE MODAL */
export function PauseModal({ onResume, onRestart, onSettings, onQuit }) {
  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-sm card p-6 rounded-3xl border-2 border-slate-100 shadow-2xl text-center space-y-4 animate-pop-in">
        <h2 className="text-xl font-display font-black text-slate-800 uppercase tracking-wider">Permainan Di-Pause</h2>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onResume}
            className="btn btn-green w-full py-3 rounded-2xl text-sm font-display uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-white" /> Lanjutkan (Resume)
          </button>

          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="btn btn-ghost w-full py-3 rounded-2xl text-sm font-display font-bold"
            >
              <RotateCcw className="w-4 h-4" /> Restart Ulang
            </button>
          )}

          <button
            type="button"
            onClick={onSettings}
            className="btn btn-ghost w-full py-3 rounded-2xl text-sm font-display font-bold"
          >
            <SettingsIcon className="w-4 h-4" /> Pengaturan Game
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="btn btn-red w-full py-3 rounded-2xl text-sm font-display font-bold"
          >
            <Home className="w-4 h-4" /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* WINNER CELEBRATION MODAL */
export function WinnerModal({ game, onPlayAgain, onMainMenu }) {
  useEffect(() => {
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.6 }
    });
  }, []);

  if (!game || !game.rankings) return null;

  const winnerId = game.rankings[0];
  const winnerPlayer = game.players.find(p => p.id === winnerId);

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md card p-6 rounded-3xl border-4 border-amber-300 shadow-2xl text-center space-y-5 animate-pop-in">
        <div className="inline-flex p-4 rounded-3xl bg-amber-400 text-slate-950 shadow-lg animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>

        <div>
          <h2 className="text-2xl font-display font-black text-amber-500 uppercase tracking-wider">Kemenangan!</h2>
          <p className="text-sm font-display font-bold text-slate-700 mt-1">
            <span className="text-purple-600">{winnerPlayer?.name || 'Pemain'}</span> Memenangkan Game!
          </p>
        </div>

        {/* Rankings leaderboard */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 text-left">
          <div className="text-xs font-display font-bold text-slate-400 mb-1 uppercase tracking-wider">Peringkat Akhir:</div>
          {game.rankings.map((pid, idx) => {
            const p = game.players.find(x => x.id === pid);
            return (
              <div key={pid} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 text-xs">
                <div className="flex items-center gap-2 font-display font-extrabold">
                  <span className="w-5 text-amber-500 text-center font-black">#{idx + 1}</span>
                  <span className="text-slate-800">{p?.name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{p?.color}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn btn-yellow flex-1 py-3 rounded-2xl text-xs font-display uppercase tracking-wider"
          >
            Main Lagi
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="btn btn-ghost flex-1 py-3 rounded-2xl text-xs font-display uppercase font-bold"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* STATS MODAL */
export function StatsModal({ stats, onClose }) {
  if (!stats) return null;

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md card p-6 rounded-3xl border-2 border-slate-100 shadow-2xl relative space-y-4 animate-pop-in">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="text-lg font-display font-black text-purple-600 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" /> Statistik Permainan
          </h2>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <div className="text-2xl font-display font-black text-slate-800">{stats.games}</div>
            <div className="text-[10px] font-display font-bold text-slate-400 uppercase">Total Main</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-100">
            <div className="text-2xl font-display font-black text-emerald-600">{stats.wins}</div>
            <div className="text-[10px] font-display font-bold text-emerald-700 uppercase">Total Menang</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-100">
            <div className="text-2xl font-display font-black text-rose-600">{stats.captures}</div>
            <div className="text-[10px] font-display font-bold text-rose-700 uppercase">Bidak Ditangkap</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-100">
            <div className="text-2xl font-display font-black text-amber-600">{stats.sixes}</div>
            <div className="text-[10px] font-display font-bold text-amber-700 uppercase">Angka 6 Didapat</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* SETTINGS MODAL */
export function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = React.useState({ ...settings });

  const toggle = key => {
    setLocal(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md card p-6 rounded-3xl border-2 border-slate-100 shadow-2xl relative space-y-4 animate-pop-in">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="text-lg font-display font-black text-purple-600 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-purple-600" /> Pengaturan Game
          </h2>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <span className="text-xs font-display font-bold text-slate-700">Bonus Turn Saat Tangkap Bidak</span>
            <input
              type="checkbox"
              checked={local.bonusTurnOnCapture}
              onChange={() => toggle('bonusTurnOnCapture')}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <span className="text-xs font-display font-bold text-slate-700">Aturan Triple Six (3x Enam Hangus)</span>
            <input
              type="checkbox"
              checked={local.tripleSix}
              onChange={() => toggle('tripleSix')}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <span className="text-xs font-display font-bold text-slate-700">Aturan Block Benteng (2 Bidak)</span>
            <input
              type="checkbox"
              checked={local.enableBlockRule}
              onChange={() => toggle('enableBlockRule')}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <span className="text-xs font-display font-bold text-slate-700">Auto Move Jika 1 Langkah Valid</span>
            <input
              type="checkbox"
              checked={local.autoMove}
              onChange={() => toggle('autoMove')}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSave(local);
            onClose();
          }}
          className="btn btn-purple w-full py-3 rounded-2xl text-xs font-display uppercase tracking-wider"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}

/* HOW TO PLAY TUTORIAL MODAL */
export function HowToPlayModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-lg card p-6 rounded-3xl border-2 border-slate-100 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col animate-pop-in">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="text-lg font-display font-black text-purple-600 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" /> Cara Bermain (How to Play)
          </h2>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 text-xs font-body text-slate-600 pr-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <div className="font-display font-bold text-purple-600 mb-1">1. Mengeluarkan Bidak</div>
            Bidak berada di Base dan hanya bisa keluar ke jalur awal jika kamu melemparkan dadu bernilai <strong>6</strong>.
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <div className="font-display font-bold text-purple-600 mb-1">2. Menangkap Bidak Lawan</div>
            Jika bidakmu mendarat di tile non-aman yang ditempati bidak lawan, bidak lawan akan tertangkap dan dikembalikan ke Base!
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <div className="font-display font-bold text-purple-600 mb-1">3. Tile Aman (Safe Zone)</div>
            Tile yang memiliki tanda bintang ✦ (serta tile awal) adalah area aman. Bidak di area ini tidak bisa ditangkap lawan.
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <div className="font-display font-bold text-purple-600 mb-1">4. Mencapai Finish Center</div>
            Bawa seluruh 4 bidakmu mengelilingi papan dan masuk ke jalur Finish berwarna khusus. Angka dadu harus <strong>tepat</strong> untuk masuk ke pusat Finish.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ACHIEVEMENTS MODAL */
export function AchievementsModal({ onClose }) {
  const achievements = [
    { title: 'First Victory', desc: 'Menangkan 1 permainan Ludo', icon: '🏆', done: true },
    { title: 'Hunter', desc: 'Tangkap 10 bidak lawan', icon: '🏹', done: true },
    { title: 'Lucky Six', desc: 'Dapatkan angka 6 sebanyak 3 kali', icon: '🎲', done: true },
    { title: 'Champion', desc: 'Menangkan 10 permainan', icon: '👑', done: false }
  ];

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md card p-6 rounded-3xl border-2 border-slate-100 shadow-2xl relative space-y-4 animate-pop-in">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="text-lg font-display font-black text-purple-600 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" /> Pencapaian (Achievements)
          </h2>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {achievements.map((ach, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 ${
                ach.done ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className="text-2xl">{ach.icon}</div>
              <div className="flex-1">
                <div className="text-xs font-display font-extrabold text-slate-800">{ach.title}</div>
                <div className="text-[10px] font-body text-slate-500">{ach.desc}</div>
              </div>
              {ach.done && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
