import React, { useState, useEffect } from 'react';
import { Users, Plus, Key, Play, CheckCircle2, Copy, Crown, ArrowLeft, Edit3, Check, Share2 } from 'lucide-react';
import { readStorage, writeStorage } from '../lib/ludo/storage';
import { copyToClipboard } from '../lib/ludo/clipboard';

export default function OnlineLobby({
  onBack,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onSelectColor,
  onUpdateName,
  roomState,
  onToggleReady,
  onStartGame,
  socketId,
  initialCode = ''
}) {
  const savedProfileName = typeof window !== 'undefined' ? readStorage('profileName', '') : '';

  const [mode, setMode] = useState(initialCode ? 'JOIN' : 'CHOICE'); // CHOICE | CREATE | JOIN | IN_ROOM | QUICK
  const [hostName, setHostName] = useState(savedProfileName);
  const [playerName, setPlayerName] = useState(savedProfileName);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [playerCount, setPlayerCount] = useState(4);
  const [turnTimer, setTurnTimer] = useState(15);
  const [botFill, setBotFill] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const currentRoom = roomState;
  const isHost = currentRoom && currentRoom.hostSocketId === socketId;
  const myPlayer = currentRoom?.players.find(p => p.socketId === socketId);

  const handleColorSelect = color => {
    if (!onSelectColor || !myPlayer || myPlayer.color === color) return;
    setError('');
    onSelectColor(color, res => {
      if (!res?.success) setError(res?.error || 'Warna tidak dapat dipilih');
    });
  };

  const handleSaveNewName = () => {
    if (!tempName.trim()) return;
    const clean = tempName.trim().slice(0, 15);
    writeStorage('profileName', clean);
    if (onUpdateName) {
      onUpdateName(clean, res => {
        if (!res?.success) setError(res?.error || 'Gagal mengubah nama');
      });
    }
    setEditingName(false);
  };

  const handleShareRoom = async () => {
    if (!currentRoom?.code) return;
    const directUrl = `${window.location.origin}/?room=${currentRoom.code}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Main Ludo Bareng!',
          text: `Gabung ke ruangan Ludo (Kode: ${currentRoom.code}) dan main bareng!`,
          url: directUrl
        });
        return;
      } catch {
        // Fallback if cancelled
      }
    }
    copyDirectLink();
  };

  useEffect(() => {
    if (initialCode && !joinCode) setJoinCode(initialCode);
  }, [initialCode]);

  const handleCreate = e => {
    e.preventDefault();
    setError('');
    const name = hostName.trim();
    if (!name) {
      setError('Masukkan nama kamu');
      return;
    }
    writeStorage('profileName', name);
    onCreateRoom({ hostName: name, playerCount, turnTimer, botFill }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal membuat ruangan');
    });
  };

  const handleJoin = e => {
    e.preventDefault();
    setError('');
    const name = playerName.trim();
    if (!name || !joinCode.trim()) {
      setError('Masukkan nama dan kode ruangan');
      return;
    }
    writeStorage('profileName', name);
    onJoinRoom({ roomCode: joinCode.trim().toUpperCase(), playerName: name }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal bergabung ke ruangan');
    });
  };

  const handleQuick = e => {
    e.preventDefault();
    setError('');
    const name = playerName.trim();
    if (!name) {
      setError('Masukkan nama kamu');
      return;
    }
    writeStorage('profileName', name);
    onQuickMatch({ playerName: name }, res => {
      if (res?.success) setMode('IN_ROOM');
      else setError(res?.error || 'Gagal mencari pertandingan acak');
    });
  };

  const copyDirectLink = async () => {
    if (!currentRoom?.code) return;
    const directUrl = `${window.location.origin}/?room=${currentRoom.code}`;
    const ok = await copyToClipboard(directUrl);
    if (ok) {
      setCopySuccess('Link direct berhasil disalin!');
    } else {
      setCopySuccess('Gagal menyalin link secara otomatis.');
    }
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const copyCodeOnly = async () => {
    if (!currentRoom?.code) return;
    const ok = await copyToClipboard(currentRoom.code);
    if (ok) {
      setCopySuccess(`Kode ${currentRoom.code} berhasil disalin!`);
    } else {
      setCopySuccess('Gagal menyalin kode.');
    }
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
            <div className="text-right space-y-1.5">
              <span className="text-xs font-display font-bold text-slate-600 chip px-3 py-1 block">
                {currentRoom.players.length}/{currentRoom.config?.playerCount || 4} Pemain
              </span>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={copyDirectLink}
                  className="text-[11px] font-display font-extrabold text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Salin Link
                </button>
                <button
                  type="button"
                  onClick={handleShareRoom}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[11px] font-display font-bold flex items-center gap-1 hover:bg-purple-700 shadow-sm"
                  title="Bagikan Link Ruangan"
                >
                  <Share2 className="w-3 h-3" /> Bagikan
                </button>
              </div>
            </div>
          </div>

          {/* List of Players in Lobby */}
          <div className="space-y-2.5">
            {currentRoom.players.map((p, idx) => {
              const isMe = p.socketId === socketId;
              return (
                <div
                  key={p.id || idx}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 ${
                    isMe ? 'bg-purple-50/80 border-purple-300' : 'bg-slate-50 border-slate-100'
                  }`}
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
                      {isMe && editingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={15}
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveNewName()}
                            className="px-2 py-1 text-xs font-display font-bold border-2 border-purple-400 rounded-lg outline-none text-slate-800 bg-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveNewName}
                            className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                            title="Simpan Nama"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-display font-extrabold text-slate-800 flex items-center gap-1.5">
                          {p.name}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                setTempName(p.name);
                                setEditingName(true);
                              }}
                              className="text-purple-600 hover:text-purple-800 p-0.5"
                              title="Ubah Nama Kamu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {currentRoom.hostSocketId === p.socketId && (
                            <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{p.type} {isMe ? '(Kamu)' : ''}</div>
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
              );
            })}
          </div>

          {/* COLOR SELECTION FOR MY PLAYER */}
          {myPlayer && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 space-y-2">
              <div className="text-xs font-display font-bold text-slate-600">Pilih Warna Bidak Kamu:</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { color: 'red', name: 'Merah', bg: 'bg-rose-500' },
                  { color: 'green', name: 'Hijau', bg: 'bg-emerald-500' },
                  { color: 'yellow', name: 'Kuning', bg: 'bg-amber-400' },
                  { color: 'blue', name: 'Biru', bg: 'bg-blue-500' }
                ].map(c => {
                  const takenBy = currentRoom.players.find(p => p.color === c.color);
                  const isMine = myPlayer.color === c.color;
                  const isTakenByOther = takenBy && !isMine;

                  return (
                    <button
                      key={c.color}
                      type="button"
                      disabled={isTakenByOther}
                      onClick={() => handleColorSelect(c.color)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                        isMine
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-400 scale-105'
                          : isTakenByOther
                          ? 'opacity-40 border-slate-200 bg-slate-100 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${c.bg} shadow-sm`} />
                      <span className={`text-[10px] font-display font-black ${isMine ? 'text-purple-700' : 'text-slate-700'}`}>
                        {c.name}
                      </span>
                      {isTakenByOther && <span className="text-[8px] font-bold text-slate-400 truncate max-w-full">{takenBy.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
