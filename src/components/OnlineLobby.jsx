'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Key, Play, CheckCircle2, Copy, Crown, ArrowLeft } from 'lucide-react';

export default function OnlineLobby({
  onBack,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  roomState,
  onToggleReady,
  onStartGame,
  socketId,
  initialCode = ''
}) {
  const [mode, setMode] = useState(initialCode ? 'JOIN' : 'CHOICE'); // CHOICE | CREATE | JOIN | IN_ROOM | QUICK
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [playerCount, setPlayerCount] = useState(4);
  const [turnTimer, setTurnTimer] = useState(15);
  const [botFill, setBotFill] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const currentRoom = roomState;
  const isHost = currentRoom && currentRoom.hostSocketId === socketId;

  useEffect(() => {
    if (initialCode && !joinCode) setJoinCode(initialCode);
  }, [initialCode]);

  const handleCreate = e => {
    e.preventDefault();
    setError('');
    if (!hostName.trim()) {
      setError('Masukkan nama kamu');
      return;
    }
    onCreateRoom({ hostName: hostName.trim(), playerCount, turnTimer, botFill }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal membuat ruangan');
    });
  };

  const handleJoin = e => {
    e.preventDefault();
    setError('');
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Masukkan nama dan kode ruangan');
      return;
    }
    onJoinRoom({ roomCode: joinCode.trim().toUpperCase(), playerName: playerName.trim() }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal bergabung ke ruangan');
    });
  };

  const handleQuick = e => {
    e.preventDefault();
    setError('');
    if (!playerName.trim()) {
      setError('Masukkan nama kamu');
      return;
    }
    onQuickMatch({ playerName: playerName.trim() }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal mencari pertandingan acak');
    });
  };

  const copyDirectLink = () => {
    if (!currentRoom?.code) return;
    const directUrl = `${window.location.origin}/?room=${currentRoom.code}`;
    navigator.clipboard.writeText(directUrl);
    setCopySuccess('Link direct berhasil disalin!');
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const copyCodeOnly = () => {
    if (!currentRoom?.code) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopySuccess(`Kode ${currentRoom.code} berhasil disalin!`);
    setTimeout(() => setCopySuccess(''), 3000);
  };

  useEffect(() => {
    if (currentRoom && mode !== 'IN_ROOM') setMode('IN_ROOM');
  }, [currentRoom, mode]);

  return (
    <div className="w-full max-w-lg mx-auto p-6 card space-y-6 view-enter">
      {copySuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-xs font-display font-black text-center shadow-md animate-fade-in">
          {copySuccess}
        </div>
      )}

      {/* CHOICE MODE */}
      {mode === 'CHOICE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <h2 className="text-xl font-display font-black text-purple-600 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Online Multiplayer
            </h2>
            <button type="button" onClick={onBack} className="icon-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <button
              type="button"
              onClick={() => setMode('QUICK')}
              className="btn btn-yellow p-4 rounded-2xl flex items-center justify-between text-left shadow-card hover:scale-[1.02]"
            >
              <div>
                <div className="text-base font-display font-black flex items-center gap-2">
                  <Play className="w-5 h-5 fill-slate-950" /> Quick Match (Gabung Acak)
                </div>
                <div className="text-xs opacity-90 font-semibold font-body">Cari ruangan publik yang tersedia secara cepat</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('CREATE')}
              className="btn btn-purple p-4 rounded-2xl flex items-center justify-between text-left shadow-card hover:scale-[1.02]"
            >
              <div>
                <div className="text-base font-display font-black flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Buat Ruangan Baru
                </div>
                <div className="text-xs opacity-90 font-semibold font-body">Host room private dan bagikan kode ke teman</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('JOIN')}
              className="btn btn-green p-4 rounded-2xl flex items-center justify-between text-left shadow-card hover:scale-[1.02]"
            >
              <div>
                <div className="text-base font-display font-black flex items-center gap-2">
                  <Key className="w-5 h-5" /> Gabung Kode Ruangan
                </div>
                <div className="text-xs opacity-90 font-semibold font-body">Masukkan 6 karakter kode room milik temanmu</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* QUICK MATCH FORM */}
      {mode === 'QUICK' && (
        <form onSubmit={handleQuick} className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <h3 className="text-lg font-display font-bold text-slate-800">Quick Matchmaking</h3>
            <button type="button" onClick={() => setMode('CHOICE')} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Batal
            </button>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold">{error}</div>}

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Nama Pemain (Kamu):</label>
            <input
              type="text"
              required
              maxLength={15}
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Contoh: Alex"
              className="input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-yellow w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-slate-950" /> Cari Pertandingan
          </button>
        </form>
      )}

      {/* CREATE ROOM FORM */}
      {mode === 'CREATE' && (
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <h3 className="text-lg font-display font-bold text-slate-800">Pengaturan Room Baru</h3>
            <button type="button" onClick={() => setMode('CHOICE')} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Batal
            </button>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold">{error}</div>}

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Nama Pemain (Kamu):</label>
            <input
              type="text"
              required
              maxLength={15}
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              placeholder="Contoh: Andi"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Jumlah Pemain:</label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`seg ${playerCount === n ? 'aria-pressed' : ''}`}
                  aria-pressed={playerCount === n}
                >
                  {n} Pemain
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Durasi Giliran (Timer):</label>
            <select
              value={turnTimer}
              onChange={e => setTurnTimer(Number(e.target.value))}
              className="input cursor-pointer"
            >
              <option value={10}>10 Detik (Cepat)</option>
              <option value={15}>15 Detik (Standar)</option>
              <option value={30}>30 Detik (Santai)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-2 border-slate-100">
            <span className="text-xs font-display font-bold text-slate-700">Isi Slot Kosong dengan Bot AI</span>
            <input
              type="checkbox"
              checked={botFill}
              onChange={e => setBotFill(e.target.checked)}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="btn btn-purple w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider"
          >
            Buat Ruangan
          </button>
        </form>
      )}

      {/* JOIN ROOM FORM */}
      {mode === 'JOIN' && (
        <form onSubmit={handleJoin} className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <h3 className="text-lg font-display font-bold text-slate-800">Gabung ke Ruangan</h3>
            <button type="button" onClick={() => setMode('CHOICE')} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Batal
            </button>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold">{error}</div>}

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Nama Pemain:</label>
            <input
              type="text"
              required
              maxLength={15}
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Contoh: Budi"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Kode Ruangan (6 Karakter):</label>
            <input
              type="text"
              required
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="LUDO7X"
              className="input uppercase text-center font-display font-black text-2xl tracking-widest text-purple-600"
            />
          </div>

          <button
            type="submit"
            className="btn btn-green w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider"
          >
            Gabung Permainan
          </button>
        </form>
      )}

      {/* LOBBY ROOM WAITING */}
      {mode === 'IN_ROOM' && currentRoom && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <div>
              <div className="text-xs font-display font-bold text-slate-400">Kode Ruangan:</div>
              <div className="flex items-center gap-2">
                <span onClick={copyCodeOnly} className="text-3xl font-display font-black text-purple-600 cursor-pointer hover:opacity-80 transition-opacity">
                  {currentRoom.code}
                </span>
                <button type="button" onClick={copyCodeOnly} className="icon-btn p-1.5" title="Salin Kode">
                  <Copy className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs font-display font-bold text-slate-600 chip px-3 py-1 block">
                {currentRoom.players.length}/{currentRoom.config?.playerCount || 4} Pemain
              </span>
              <button
                type="button"
                onClick={copyDirectLink}
                className="text-[11px] font-display font-extrabold text-purple-600 hover:underline flex items-center gap-1 justify-end"
              >
                <Copy className="w-3 h-3" /> Salin Direct Link URL
              </button>
            </div>
          </div>

          {/* List of Players in Lobby */}
          <div className="space-y-2.5">
            {currentRoom.players.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-display font-bold text-white text-sm shadow-sm ${
                      p.color === 'red'
                        ? 'bg-rose-500'
                        : p.color === 'green'
                        ? 'bg-emerald-500'
                        : p.color === 'yellow'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-blue-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-display font-extrabold text-slate-800 flex items-center gap-1.5">
                      {p.name}
                      {currentRoom.hostSocketId === p.socketId && (
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{p.type}</div>
                  </div>
                </div>

                <div>
                  {p.isReady ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-display font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-xs font-display font-bold">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            {isHost ? (
              <button
                type="button"
                onClick={onStartGame}
                className="btn btn-yellow w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-slate-950" /> Mulai Permainan
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleReady}
                className="btn btn-purple w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider"
              >
                Toggle Ready Status
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('CHOICE');
                onBack && onBack();
              }}
              className="btn btn-ghost w-full py-2.5 rounded-2xl text-xs font-display font-bold"
            >
              Keluar dari Ruangan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
