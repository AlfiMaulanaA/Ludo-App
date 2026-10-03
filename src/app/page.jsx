'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createGame, dispatch, getCurrentPlayer, getValidMoves, DEFAULT_SETTINGS } from '../lib/ludo/engine';
import { chooseMove } from '../lib/ludo/ai';
import { AudioManager } from '../lib/ludo/audio';
import { recordGameStats, readStorage, writeStorage, getEmptyStats, loadSavedGame, saveGame, clearSavedGame } from '../lib/ludo/storage';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket/socketClient';

import LudoBoard from '../components/LudoBoard';
import DiceRoller from '../components/DiceRoller';
import PlayerCard from '../components/PlayerCard';
import GameHeader from '../components/GameHeader';
import OnlineLobby from '../components/OnlineLobby';
import EmotePicker from '../components/EmotePicker';
import ChatPanel from '../components/ChatPanel';
import { PauseModal, WinnerModal, StatsModal, SettingsModal, HowToPlayModal, AchievementsModal, ConfirmModal } from '../components/Modals';

import { Users, Bot as BotIcon, Globe, BarChart3, Award, Settings, HelpCircle, Play, Sparkles } from 'lucide-react';

const COLOR_LAYOUT = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue']
};
const TIMER_OPTIONS = [0, 10, 15, 30];

function Segmented({ options, value, onChange, format = v => v }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className="seg"
          aria-pressed={value === o}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [viewState, setViewState] = useState('MENU'); // MENU | LOCAL_SETUP | BOT_SETUP | ONLINE_LOBBY | GAME
  const [game, setGame] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasSaved, setHasSaved] = useState(false);
  const [shownDice, setShownDice] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Online & Reactions State
  const [onlineRoomState, setOnlineRoomState] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [onlineMessages, setOnlineMessages] = useState([]);
  const [floatingEmotes, setFloatingEmotes] = useState([]);
  const [speechBubbles, setSpeechBubbles] = useState({}); // { playerId: text }
  const [notice, setNotice] = useState('');

  // Modals
  const [showPause, setShowPause] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Setup
  const [localPlayerCount, setLocalPlayerCount] = useState(4);
  const [localPlayerNames, setLocalPlayerNames] = useState(['Pemain 1', 'Pemain 2', 'Pemain 3', 'Pemain 4']);
  const [localPlayerColors, setLocalPlayerColors] = useState(['red', 'green', 'yellow', 'blue']);
  const [botCount, setBotCount] = useState(3);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [humanBotName, setHumanBotName] = useState('Kamu');
  const [humanBotColor, setHumanBotColor] = useState('red');
  const [setupTimer, setSetupTimer] = useState(15);
  const [initialRoomCode, setInitialRoomCode] = useState('');

  const audioRef = useRef(null);
  const gameRef = useRef(null);
  gameRef.current = game;

  const isOnline = !!game?.isOnlineMode;
  const activePlayer = game ? getCurrentPlayer(game) : null;
  const myOnlinePlayerId = onlineRoomState?.players.find(p => p.socketId === socketId)?.id;
  const isMyTurn = !!game && game.turnState !== 'GAME_OVER' && !!activePlayer && (isOnline ? activePlayer.id === myOnlinePlayerId && activePlayer.type === 'human' : activePlayer.type === 'human');
  const paused = showPause || showSettings;

  // Audio, persisted settings & URL search param room detection
  useEffect(() => {
    audioRef.current = new AudioManager(settings);
    audioRef.current.startMusic();
    const saved = readStorage('settings');
    if (saved) setSettings(s => ({ ...s, ...saved }));
    setHasSaved(!!loadSavedGame());

    // Check for ?room=CODE or ?code=CODE search parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('room') || params.get('code');
      if (urlCode) {
        const cleaned = urlCode.toUpperCase().trim();
        setInitialRoomCode(cleaned);
        connectSocket();
        setViewState('ONLINE_LOBBY');
      }
    }

    return () => audioRef.current?.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.settings = settings;
  }, [settings]);

  const triggerSpeechBubble = (playerId, text) => {
    if (!playerId) return;
    setSpeechBubbles(prev => ({ ...prev, [playerId]: text }));
    audioRef.current?.play('click');
    setTimeout(() => {
      setSpeechBubbles(prev => {
        const next = { ...prev };
        if (next[playerId] === text) delete next[playerId];
        return next;
      });
    }, 3500);
  };

  const playEvents = useCallback((g, lastAction) => {
    const audio = audioRef.current;
    if (!audio || !g) return;
    if (lastAction === 'ROLL_DICE') audio.play('dice');
    for (const e of g.events || []) {
      if (e.type === 'MOVE_PIECE') audio.play('move');
      if (e.type === 'CAPTURE_PIECE') audio.play('capture');
      if (e.type === 'PIECE_FINISHED') audio.play('finish');
    }
    if (g.turnState === 'GAME_OVER') audio.play('victory');
  }, []);

  // Offline action dispatcher
  const applyAction = useCallback(
    action => {
      const current = gameRef.current;
      if (!current || current.isOnlineMode) return false;
      const next = structuredClone(current);
      if (!dispatch(next, action)) return false;
      gameRef.current = next;
      setGame(next);
      playEvents(next, action.type);
      return true;
    },
    [playEvents]
  );

  // Socket wiring
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onConnect = () => setSocketId(s.id);
    const onRoom = rs => setOnlineRoomState(rs);
    const onStarted = ({ roomState, game: g }) => {
      setOnlineRoomState(roomState);
      setGame(g);
      setShownDice(null);
      setViewState('GAME');
      audioRef.current?.startMusic();
    };
    const onUpdated = ({ game: g, lastAction }) => {
      setGame(g);
      playEvents(g, lastAction);
    };
    const onEmote = ({ playerId, emote }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setFloatingEmotes(prev => [...prev, { id, playerId, emote }]);
      triggerSpeechBubble(playerId, emote);
      setTimeout(() => setFloatingEmotes(prev => prev.filter(x => x.id !== id)), 2500);
    };
    const onChat = msg => {
      setOnlineMessages(prev => [...prev.slice(-49), msg]);
      const senderPlayer = gameRef.current?.players.find(p => p.name === msg.sender);
      if (senderPlayer) triggerSpeechBubble(senderPlayer.id, msg.text);
    };
    const onLeft = ({ name, reason, roomState }) => {
      if (roomState) setOnlineRoomState(roomState);
      setNotice(reason === 'AFK' ? `${name} tidak aktif — bot mengambil alih.` : `${name} terputus — bot mengambil alih.`);
      setTimeout(() => setNotice(''), 4000);
    };
    const onDeadline = ({ deadline: d }) => setDeadline(d);

    s.on('connect', onConnect);
    s.on('ROOM_UPDATED', onRoom);
    s.on('GAME_STARTED', onStarted);
    s.on('GAME_UPDATED', onUpdated);
    s.on('EMOTE_RECEIVED', onEmote);
    s.on('CHAT_RECEIVED', onChat);
    s.on('PLAYER_LEFT', onLeft);
    s.on('TURN_DEADLINE', onDeadline);
    return () => {
      s.off('connect', onConnect);
      s.off('ROOM_UPDATED', onRoom);
      s.off('GAME_STARTED', onStarted);
      s.off('GAME_UPDATED', onUpdated);
      s.off('EMOTE_RECEIVED', onEmote);
      s.off('CHAT_RECEIVED', onChat);
      s.off('PLAYER_LEFT', onLeft);
      s.off('TURN_DEADLINE', onDeadline);
    };
  }, [playEvents]);

  // Keep last roll visible
  useEffect(() => {
    if (!game) return;
    if (game.diceValue) setShownDice(game.diceValue);
    else {
      const noMove = game.events?.find(e => e.type === 'NO_MOVES');
      if (noMove) setShownDice(noMove.diceValue);
      else if (game.events?.some(e => e.type === 'TRIPLE_SIX')) setShownDice(6);
    }
  }, [game]);

  // Offline autosave
  useEffect(() => {
    if (!game || game.isOnlineMode) return;
    if (game.turnState === 'GAME_OVER') {
      clearSavedGame();
      setHasSaved(false);
    } else {
      saveGame(game);
      setHasSaved(true);
    }
  }, [game]);

  // Offline game over stats
  useEffect(() => {
    if (game && !game.isOnlineMode && game.turnState === 'GAME_OVER') recordGameStats(game);
  }, [game?.turnState, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Offline bot turns
  useEffect(() => {
    if (!game || game.isOnlineMode || game.turnState === 'GAME_OVER' || paused || viewState !== 'GAME') return;
    const player = getCurrentPlayer(game);
    if (!player || player.type !== 'bot') return;
    const timer = setTimeout(() => {
      if (game.turnState === 'WAITING_FOR_ROLL') applyAction({ type: 'ROLL_DICE' });
      else if (game.turnState === 'SELECTING_PIECE') {
        const chosen = chooseMove(game, player.botDifficulty || 'medium');
        if (chosen) applyAction({ type: 'MOVE_PIECE', pieceId: chosen.id });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [game, paused, viewState, applyAction]);

  // Auto-move single valid piece
  useEffect(() => {
    if (!game || !isMyTurn || paused || viewState !== 'GAME' || !game.settings.autoMove || game.turnState !== 'SELECTING_PIECE') return;
    const valid = getValidMoves(game);
    if (valid.length !== 1) return;
    const timer = setTimeout(() => {
      if (game.isOnlineMode) getSocket()?.emit('MOVE_PIECE', { pieceId: valid[0].id });
      else applyAction({ type: 'MOVE_PIECE', pieceId: valid[0].id });
    }, 500);
    return () => clearTimeout(timer);
  }, [game, isMyTurn, paused, viewState, applyAction]);

  // Turn timer
  const turnKey = game ? `${game.id}-${game.turns}-${game.turnState}-${game.currentPlayerIndex}` : null;
  useEffect(() => {
    if (!game || game.isOnlineMode) return;
    if (game.turnState === 'GAME_OVER' || !game.settings.turnTimer || getCurrentPlayer(game)?.type !== 'human') {
      setDeadline(null);
      return;
    }
    setDeadline(Date.now() + game.settings.turnTimer * 1000);
  }, [turnKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewState !== 'GAME') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [viewState]);

  // Offline timeout handler
  useEffect(() => {
    if (!deadline || !game || game.isOnlineMode || paused || viewState !== 'GAME') return;
    const timer = setTimeout(() => {
      const g = gameRef.current;
      if (!g || g.turnState === 'GAME_OVER') return;
      if (g.turnState === 'WAITING_FOR_ROLL') applyAction({ type: 'ROLL_DICE' });
      else if (g.turnState === 'SELECTING_PIECE') {
        const choice = chooseMove(g, 'easy');
        if (choice) applyAction({ type: 'MOVE_PIECE', pieceId: choice.id });
      }
    }, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [deadline, paused, viewState, applyAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastPlayedSecondRef = useRef(null);
  const timerSeconds = deadline && activePlayer?.type === 'human' && game?.turnState !== 'GAME_OVER' ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  const maxTimerSeconds = game?.settings?.turnTimer || 15;

  // Sound warning alert when turn timer <= 5s
  useEffect(() => {
    if (viewState !== 'GAME' || !deadline || game?.turnState === 'GAME_OVER' || paused) return;
    if (timerSeconds <= 5 && timerSeconds > 0 && timerSeconds !== lastPlayedSecondRef.current) {
      lastPlayedSecondRef.current = timerSeconds;
      audioRef.current?.play('tickWarning');
    }
  }, [timerSeconds, viewState, deadline, game?.turnState, paused]);

  useEffect(() => {
    lastPlayedSecondRef.current = null;
  }, [turnKey]);

  // Starters
  const beginGame = config => {
    audioRef.current?.play('click');
    const defaultColors = COLOR_LAYOUT[config.length];
    const preparedConfig = config.map((p, i) => ({
      ...p,
      color: p.color || defaultColors[i]
    }));
    const g = createGame(preparedConfig, { ...settings, turnTimer: setupTimer });
    setGame(g);
    setShownDice(null);
    setViewState('GAME');
    audioRef.current?.startMusic();
  };

  const startLocalGame = () => {
    const players = Array.from({ length: localPlayerCount }, (_, i) => ({
      name: localPlayerNames[i]?.trim() || `Pemain ${i + 1}`,
      type: 'human',
      color: localPlayerColors[i]
    }));
    beginGame(players);
  };

  const startBotGame = () => {
    const allColors = ['red', 'green', 'yellow', 'blue'];
    const remainingColors = allColors.filter(c => c !== humanBotColor);
    const players = [
      { name: humanBotName?.trim() || 'Kamu', type: 'human', color: humanBotColor },
      ...Array.from({ length: botCount }, (_, i) => ({
        name: `Bot ${i + 1}`,
        type: 'bot',
        botDifficulty,
        color: remainingColors[i % remainingColors.length]
      }))
    ];
    beginGame(players);
  };

  const continueGame = () => {
    const saved = loadSavedGame();
    if (!saved) return setHasSaved(false);
    setGame(saved);
    setShownDice(saved.diceValue);
    setViewState('GAME');
    audioRef.current?.startMusic();
  };

  const restartOffline = () => {
    if (!game || game.isOnlineMode) return;
    const g = createGame(
      game.players.map(p => ({ name: p.name, type: p.type, botDifficulty: p.botDifficulty, color: p.color })),
      { ...game.settings }
    );
    setGame(g);
    setShownDice(null);
  };

  const leaveToMenu = () => {
    if (game?.isOnlineMode || viewState === 'ONLINE_LOBBY') {
      disconnectSocket();
      setOnlineRoomState(null);
      setOnlineMessages([]);
      setSocketId(null);
    }
    audioRef.current?.stopMusic();
    setGame(null);
    setDeadline(null);
    setShowPause(false);
    setViewState('MENU');
  };

  // Player input
  const handleRollDice = () => {
    if (!game || !isMyTurn || game.turnState !== 'WAITING_FOR_ROLL') return;
    audioRef.current?.unlock();
    if (game.isOnlineMode) getSocket()?.emit('ROLL_DICE');
    else applyAction({ type: 'ROLL_DICE' });
  };

  const handlePieceClick = pieceId => {
    if (!game || !isMyTurn || game.turnState !== 'SELECTING_PIECE') return;
    if (game.isOnlineMode) getSocket()?.emit('MOVE_PIECE', { pieceId });
    else applyAction({ type: 'MOVE_PIECE', pieceId });
  };

  const toggleMute = () => {
    const updated = { ...settings, mute: !settings.mute };
    setSettings(updated);
    writeStorage('settings', updated);
  };

  const saveSettings = updated => {
    setSettings(updated);
    writeStorage('settings', updated);
  };

  // Online handlers
  const openOnlineLobby = () => {
    connectSocket();
    setViewState('ONLINE_LOBBY');
  };
  const handleCreateOnlineRoom = (opts, cb) => {
    const s = connectSocket();
    if (!s) return cb?.({ success: false, error: 'Socket tidak dapat terhubung' });
    s.emit('CREATE_ROOM', opts, res => {
      if (res?.success && res?.roomState) setOnlineRoomState(res.roomState);
      cb?.(res);
    });
  };
  const handleJoinOnlineRoom = (opts, cb) => {
    const s = connectSocket();
    if (!s) return cb?.({ success: false, error: 'Socket tidak dapat terhubung' });
    s.emit('JOIN_ROOM', opts, res => {
      if (res?.success && res?.roomState) setOnlineRoomState(res.roomState);
      cb?.(res);
    });
  };
  const handleQuickMatchOnlineRoom = (opts, cb) => {
    const s = connectSocket();
    if (!s) return cb?.({ success: false, error: 'Socket tidak dapat terhubung' });
    s.emit('QUICK_MATCH', opts, res => {
      if (res?.success && res?.roomState) setOnlineRoomState(res.roomState);
      cb?.(res);
    });
  };
  const handleSelectColorOnlineRoom = (color, cb) => {
    const s = connectSocket();
    if (!s) return cb?.({ success: false, error: 'Socket tidak dapat terhubung' });
    s.emit('SELECT_COLOR', { color }, cb);
  };
  const handleToggleReady = () => getSocket()?.emit('TOGGLE_READY');
  const handleStartOnlineGame = () =>
    getSocket()?.emit(
      'START_GAME',
      { enableBlockRule: settings.enableBlockRule, tripleSix: settings.tripleSix, bonusTurnOnCapture: settings.bonusTurnOnCapture },
      res => res && !res.success && setNotice(res.error)
    );

  const handleSendEmote = emote => {
    if (game?.isOnlineMode) {
      getSocket()?.emit('SEND_EMOTE', { emote });
    } else if (activePlayer) {
      triggerSpeechBubble(activePlayer.id, emote);
    }
  };

  const handleSendChatMessage = text => {
    if (game?.isOnlineMode) {
      getSocket()?.emit('SEND_CHAT', { text });
    } else if (activePlayer) {
      triggerSpeechBubble(activePlayer.id, text);
    }
  };

  const validMoves = game && isMyTurn && game.turnState === 'SELECTING_PIECE' ? getValidMoves(game) : [];
  const validMovePieceIds = validMoves.map(m => m.id);

  const sidePlayers = game ? [game.players.filter((_, i) => i % 2 === 0), game.players.filter((_, i) => i % 2 === 1)] : [[], []];

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-start max-w-6xl mx-auto select-none">
      {notice && (
        <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-display text-xs font-black shadow-lg animate-bounce">
          {notice}
        </div>
      )}

      {/* MENU HUB */}
      {viewState === 'MENU' && (
        <div className="w-full max-w-md mx-auto my-auto py-6 text-center space-y-6 view-enter">
          <div className="space-y-3 flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-4 ring-purple-400/40 animate-float">
                <img src="/app-logo.jpeg" alt="Ludo App Logo" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">
                LUDO <span className="text-purple-600">APP</span>
              </h1>
              <p className="text-xs font-display font-bold text-slate-500 mt-1">Offline Pass & Play • VS Bot AI • Online Realtime</p>
            </div>
          </div>

          <div className="space-y-3">
            {hasSaved && (
              <button
                id="btn-continue"
                type="button"
                onClick={continueGame}
                className="btn btn-yellow w-full p-4 rounded-2xl flex items-center justify-between shadow-card hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3"><Play className="w-5 h-5 fill-slate-950" /> Continue</div>
                <span className="text-xs font-body font-bold opacity-80">Game Tersimpan</span>
              </button>
            )}
            <button
              id="btn-local"
              type="button"
              onClick={() => setViewState('LOCAL_SETUP')}
              className="btn btn-red w-full p-4 rounded-2xl flex items-center justify-between shadow-card hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3"><Users className="w-5 h-5" /> Local Pass & Play</div>
              <span className="text-xs font-body font-semibold opacity-90">2-4 Pemain</span>
            </button>
            <button
              id="btn-bot"
              type="button"
              onClick={() => setViewState('BOT_SETUP')}
              className="btn btn-green w-full p-4 rounded-2xl flex items-center justify-between shadow-card hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3"><BotIcon className="w-5 h-5" /> Play VS Bot AI</div>
              <span className="text-xs font-body font-semibold opacity-90">Offline</span>
            </button>
            <button
              id="btn-online"
              type="button"
              onClick={openOnlineLobby}
              className="btn btn-purple w-full p-4 rounded-2xl flex items-center justify-between shadow-card hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3"><Globe className="w-5 h-5" /> Online Multiplayer</div>
              <span className="text-xs font-body font-semibold opacity-90">WebSockets</span>
            </button>
          </div>

          {/* Sub menu grid */}
          <div className="grid grid-cols-4 gap-2.5 pt-2">
            {[
              [BarChart3, 'Statistik', () => setShowStats(true)],
              [Award, 'Piala', () => setShowAchievements(true)],
              [Settings, 'Setting', () => setShowSettings(true)],
              [HelpCircle, 'Tutorial', () => setShowHowToPlay(true)]
            ].map(([Icon, label, onClick]) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="card p-3 rounded-2xl flex flex-col items-center gap-1.5 hover:border-purple-300 transition-colors cursor-pointer"
              >
                <Icon className="w-5 h-5 text-purple-600" />
                <span className="text-[10px] font-display font-bold text-slate-700">{label}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 text-center">
            <span className="text-[11px] font-display font-extrabold text-slate-500 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm inline-flex items-center gap-1.5">
              Developed by <span className="text-purple-600 font-black tracking-wide">maul.dev</span> 🚀
            </span>
          </div>
        </div>
      )}

      {/* LOCAL PASS & PLAY SETUP */}
      {viewState === 'LOCAL_SETUP' && (
        <div className="w-full max-w-md mx-auto my-auto p-6 card rounded-3xl space-y-5 view-enter">
          <h2 className="text-xl font-display font-black text-purple-600">Setup Local Pass & Play</h2>
          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Jumlah Pemain</label>
            <Segmented options={[2, 3, 4]} value={localPlayerCount} onChange={setLocalPlayerCount} format={n => `${n} Pemain`} />
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Nama & Warna Pemain</label>
            <div className="space-y-2.5">
              {Array.from({ length: localPlayerCount }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <input
                    type="text"
                    maxLength={15}
                    value={localPlayerNames[idx] || ''}
                    onChange={e => {
                      const updated = [...localPlayerNames];
                      updated[idx] = e.target.value;
                      setLocalPlayerNames(updated);
                    }}
                    placeholder={`Pemain ${idx + 1}`}
                    className="input py-1.5 px-3 text-xs font-display font-bold text-slate-800 bg-white"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[
                      { color: 'red', bg: 'bg-rose-500' },
                      { color: 'green', bg: 'bg-emerald-500' },
                      { color: 'yellow', bg: 'bg-amber-400' },
                      { color: 'blue', bg: 'bg-blue-500' }
                    ].map(c => {
                      const isSelected = localPlayerColors[idx] === c.color;
                      const isUsedByOther = localPlayerColors.slice(0, localPlayerCount).some((col, i) => i !== idx && col === c.color);
                      return (
                        <button
                          key={c.color}
                          type="button"
                          disabled={isUsedByOther}
                          onClick={() => {
                            const updated = [...localPlayerColors];
                            const currentOwnerIdx = updated.indexOf(c.color);
                            if (currentOwnerIdx !== -1) {
                              updated[currentOwnerIdx] = updated[idx];
                            }
                            updated[idx] = c.color;
                            setLocalPlayerColors(updated);
                          }}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
                            isSelected ? 'border-purple-600 ring-2 ring-purple-300 scale-110' : isUsedByOther ? 'opacity-30 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:scale-105'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ${c.bg}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Timer Giliran</label>
            <Segmented options={TIMER_OPTIONS} value={setupTimer} onChange={setSetupTimer} format={n => (n ? `${n}s` : 'Off')} />
          </div>
          <button
            id="btn-start-local"
            type="button"
            onClick={startLocalGame}
            className="btn btn-purple w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider"
          >
            Mulai Permainan
          </button>
          <button type="button" onClick={() => setViewState('MENU')} className="btn btn-ghost w-full py-2.5 rounded-2xl text-xs font-display font-bold">
            Batal
          </button>
        </div>
      )}

      {/* VS BOT SETUP */}
      {viewState === 'BOT_SETUP' && (
        <div className="w-full max-w-md mx-auto my-auto p-6 card rounded-3xl space-y-5 view-enter">
          <h2 className="text-xl font-display font-black text-emerald-600">Setup VS Bot AI</h2>
          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-1">Nama Pemain (Kamu)</label>
            <input
              type="text"
              maxLength={15}
              value={humanBotName}
              onChange={e => setHumanBotName(e.target.value)}
              placeholder="Kamu"
              className="input text-xs font-display font-bold text-slate-800 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Jumlah Bot Lawan</label>
            <Segmented options={[1, 2, 3]} value={botCount} onChange={setBotCount} format={n => `${n} Bot`} />
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Tingkat Kesulitan</label>
            <Segmented options={['easy', 'medium', 'hard']} value={botDifficulty} onChange={setBotDifficulty} format={d => d.toUpperCase()} />
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Pilih Warna Kamu</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { color: 'red', label: 'Merah', bg: 'bg-rose-500' },
                { color: 'green', label: 'Hijau', bg: 'bg-emerald-500' },
                { color: 'yellow', label: 'Kuning', bg: 'bg-amber-400' },
                { color: 'blue', label: 'Biru', bg: 'bg-blue-500' }
              ].map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setHumanBotColor(c.color)}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${
                    humanBotColor === c.color ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400 scale-105' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${c.bg} shadow-sm`} />
                  <span className="text-[10px] font-display font-black text-slate-700">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-600 mb-2">Timer Giliran</label>
            <Segmented options={TIMER_OPTIONS} value={setupTimer} onChange={setSetupTimer} format={n => (n ? `${n}s` : 'Off')} />
          </div>
          <button
            id="btn-start-bot"
            type="button"
            onClick={startBotGame}
            className="btn btn-green w-full py-3.5 rounded-2xl text-sm font-display uppercase tracking-wider"
          >
            Mulai VS Bot
          </button>
          <button type="button" onClick={() => setViewState('MENU')} className="btn btn-ghost w-full py-2.5 rounded-2xl text-xs font-display font-bold">
            Batal
          </button>
        </div>
      )}

      {/* ONLINE LOBBY */}
      {viewState === 'ONLINE_LOBBY' && (
        <OnlineLobby
          onBack={leaveToMenu}
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          onQuickMatch={handleQuickMatchOnlineRoom}
          onSelectColor={handleSelectColorOnlineRoom}
          roomState={onlineRoomState}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartOnlineGame}
          socketId={socketId}
          initialCode={initialRoomCode}
        />
      )}

      {/* GAME */}
      {viewState === 'GAME' && game && (
        <div className="w-full flex flex-col items-center view-enter">
          <GameHeader
            game={game}
            onPauseClick={() => setShowPause(true)}
            onToggleMute={toggleMute}
            isMuted={!!settings.mute}
            roomCode={isOnline ? onlineRoomState?.code : null}
            onOpenEmotes={() => setShowEmotes(true)}
            onOpenChat={() => setShowChat(true)}
            onBackToMenu={() => setShowExitConfirm(true)}
          />

          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 items-center">
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-1.5 sm:gap-3">
              {sidePlayers[0].map(p => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isActive={activePlayer?.id === p.id && game.turnState !== 'GAME_OVER'}
                  isCurrentTurn={isMyTurn}
                  turnTimerSeconds={activePlayer?.id === p.id ? timerSeconds : 0}
                  maxTimerSeconds={maxTimerSeconds}
                  activeSpeechBubble={speechBubbles[p.id]}
                />
              ))}
            </div>

            <div className="lg:col-span-6 flex flex-col items-center justify-center gap-2 sm:gap-4">
              <LudoBoard game={game} validMovePieceIds={validMovePieceIds} onPieceClick={handlePieceClick} floatingEmotes={floatingEmotes} />
              <DiceRoller
                diceValue={shownDice}
                turnState={game.turnState}
                isMyTurn={isMyTurn}
                onRollDice={handleRollDice}
                activeColor={activePlayer?.color || 'red'}
                activePlayerName={activePlayer?.name || ''}
                activePlayerType={activePlayer?.type || 'human'}
              />
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-1.5 sm:gap-3">
              {sidePlayers[1].map(p => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isActive={activePlayer?.id === p.id && game.turnState !== 'GAME_OVER'}
                  isCurrentTurn={isMyTurn}
                  turnTimerSeconds={activePlayer?.id === p.id ? timerSeconds : 0}
                  maxTimerSeconds={maxTimerSeconds}
                  activeSpeechBubble={speechBubbles[p.id]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODALS */}
      {showPause && (
        <PauseModal
          onResume={() => setShowPause(false)}
          onRestart={isOnline ? null : () => { setShowPause(false); restartOffline(); }}
          onSettings={() => { setShowPause(false); setShowSettings(true); }}
          onQuit={() => {
            setShowPause(false);
            setShowExitConfirm(true);
          }}
        />
      )}

      {showExitConfirm && (
        <ConfirmModal
          title="Keluar dari Permainan?"
          message={
            isOnline
              ? "Apakah kamu yakin ingin keluar dari ruangan ini? Tempatmu akan digantikan oleh Bot AI."
              : "Apakah kamu yakin ingin keluar ke menu utama? Permainan offline kamu akan disimpan dan bisa dilanjutkan nanti."
          }
          confirmText="Ya, Keluar"
          cancelText="Batal"
          isDanger={true}
          onConfirm={() => {
            setShowExitConfirm(false);
            leaveToMenu();
          }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      {game?.turnState === 'GAME_OVER' && viewState === 'GAME' && (
        <WinnerModal
          game={game}
          onPlayAgain={() => (isOnline ? leaveToMenu() : restartOffline())}
          onMainMenu={leaveToMenu}
        />
      )}

      {showStats && <StatsModal stats={readStorage('stats', getEmptyStats())} onClose={() => setShowStats(false)} />}
      {showSettings && <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
      {showEmotes && (
        <EmotePicker
          onClose={() => setShowEmotes(false)}
          onSelectEmote={handleSendEmote}
          onSelectChat={handleSendChatMessage}
        />
      )}
      {showChat && <ChatPanel messages={onlineMessages} onClose={() => setShowChat(false)} onSendMessage={handleSendChatMessage} />}
    </main>
  );
}
