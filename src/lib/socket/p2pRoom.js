import Peer from 'peerjs';

class P2PRoomManager {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // connId -> DataConnection
    this.hostConnection = null;
    this.isHost = false;
    this.roomCode = null;
    this.listeners = new Map();
    this.myId = null;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const list = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, list);
  }

  emit(event, data) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach(cb => cb(data));
    }
  }

  createRoom({ hostName, playerCount = 4, turnTimer = 15, botFill = true }, cb) {
    const code = 'LUDO' + Math.floor(10 + Math.random() * 90);
    this.roomCode = code;
    this.isHost = true;
    this.myId = 'host_' + Date.now();

    const peerId = `ludo_room_${code}`;

    if (this.peer) this.peer.destroy();

    this.peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    const hostPlayer = {
      id: this.myId,
      socketId: this.myId,
      name: hostName || 'Host',
      color: 'red',
      type: 'human',
      isReady: true
    };

    const roomState = {
      code,
      hostSocketId: this.myId,
      config: { playerCount, turnTimer, botFill },
      players: [hostPlayer]
    };

    this.roomState = roomState;

    this.peer.on('open', () => {
      this.emit('connect', { id: this.myId });
      this.emit('ROOM_UPDATED', this.roomState);
      cb?.({ success: true, roomState: this.roomState });
    });

    this.peer.on('connection', conn => {
      const connId = conn.peer;
      this.connections.set(connId, conn);

      conn.on('data', data => {
        this.handleHostDataMessage(conn, data);
      });

      conn.on('close', () => {
        this.connections.delete(connId);
        if (this.roomState) {
          const leftPlayer = this.roomState.players.find(p => p.socketId === connId);
          this.roomState.players = this.roomState.players.filter(p => p.socketId !== connId);
          this.broadcast('ROOM_UPDATED', this.roomState);
          this.emit('ROOM_UPDATED', this.roomState);
          if (leftPlayer) {
            this.broadcast('PLAYER_LEFT', { name: leftPlayer.name, reason: 'left', roomState: this.roomState });
            this.emit('PLAYER_LEFT', { name: leftPlayer.name, reason: 'left', roomState: this.roomState });
          }
        }
      });
    });

    this.peer.on('error', err => {
      console.warn('P2P Host Error:', err);
      // Fallback if peer ID collision
      if (err.type === 'unavailable-id') {
        this.createRoom({ hostName, playerCount, turnTimer, botFill }, cb);
      } else {
        cb?.({ success: false, error: 'Gagal membuat room P2P: ' + err.message });
      }
    });
  }

  joinRoom({ roomCode, playerName }, cb) {
    const code = roomCode.toUpperCase().trim();
    this.roomCode = code;
    this.isHost = false;
    this.myId = 'guest_' + Date.now();

    const hostPeerId = `ludo_room_${code}`;

    if (this.peer) this.peer.destroy();

    this.peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        conn.send({
          type: 'JOIN_ROOM',
          payload: { name: playerName, socketId: this.myId }
        });
        this.emit('connect', { id: this.myId });
      });

      conn.on('data', data => {
        this.handleGuestDataMessage(data, cb);
      });

      conn.on('close', () => {
        this.emit('PLAYER_LEFT', { name: 'Host', reason: 'left' });
      });

      conn.on('error', err => {
        cb?.({ success: false, error: 'Gagal terhubung ke host room ' + code });
      });
    });

    this.peer.on('error', err => {
      console.warn('P2P Guest Error:', err);
      cb?.({ success: false, error: 'Ruangan ' + code + ' tidak ditemukan atau host offline.' });
    });
  }

  handleHostDataMessage(conn, data) {
    const { type, payload } = data;

    if (type === 'JOIN_ROOM') {
      const usedColors = this.roomState.players.map(p => p.color);
      const availableColors = ['red', 'green', 'yellow', 'blue'].filter(c => !usedColors.includes(c));
      const myColor = availableColors[0] || 'green';

      const newPlayer = {
        id: payload.socketId,
        socketId: payload.socketId,
        name: payload.name || 'Guest',
        color: myColor,
        type: 'human',
        isReady: true
      };

      if (this.roomState.players.length >= (this.roomState.config.playerCount || 4)) {
        conn.send({ type: 'JOIN_RESPONSE', payload: { success: false, error: 'Ruangan sudah penuh!' } });
        return;
      }

      this.roomState.players.push(newPlayer);
      conn.send({ type: 'JOIN_RESPONSE', payload: { success: true, roomState: this.roomState } });
      this.broadcast('ROOM_UPDATED', this.roomState);
      this.emit('ROOM_UPDATED', this.roomState);
    } else if (type === 'SELECT_COLOR') {
      const p = this.roomState.players.find(x => x.socketId === payload.socketId);
      if (p) p.color = payload.color;
      this.broadcast('ROOM_UPDATED', this.roomState);
      this.emit('ROOM_UPDATED', this.roomState);
    } else if (type === 'TOGGLE_READY') {
      const p = this.roomState.players.find(x => x.socketId === payload.socketId);
      if (p) p.isReady = !p.isReady;
      this.broadcast('ROOM_UPDATED', this.roomState);
      this.emit('ROOM_UPDATED', this.roomState);
    } else if (type === 'SEND_CHAT') {
      this.broadcast('CHAT_RECEIVED', payload);
      this.emit('CHAT_RECEIVED', payload);
    } else if (type === 'SEND_EMOTE') {
      this.broadcast('EMOTE_RECEIVED', payload);
      this.emit('EMOTE_RECEIVED', payload);
    } else if (type === 'CLIENT_GAME_ACTION') {
      this.broadcast('GAME_UPDATED', payload);
      this.emit('GAME_UPDATED', payload);
    }
  }

  handleGuestDataMessage(data, joinCb) {
    const { type, payload } = data;
    if (type === 'JOIN_RESPONSE') {
      if (payload.success) {
        this.roomState = payload.roomState;
        this.emit('ROOM_UPDATED', this.roomState);
        joinCb?.({ success: true, roomState: this.roomState });
      } else {
        joinCb?.({ success: false, error: payload.error });
      }
    } else if (type === 'ROOM_UPDATED') {
      this.roomState = payload;
      this.emit('ROOM_UPDATED', payload);
    } else if (type === 'GAME_STARTED') {
      this.emit('GAME_STARTED', payload);
    } else if (type === 'GAME_UPDATED') {
      this.emit('GAME_UPDATED', payload);
    } else if (type === 'EMOTE_RECEIVED') {
      this.emit('EMOTE_RECEIVED', payload);
    } else if (type === 'CHAT_RECEIVED') {
      this.emit('CHAT_RECEIVED', payload);
    } else if (type === 'PLAYER_LEFT') {
      this.emit('PLAYER_LEFT', payload);
    }
  }

  broadcast(type, payload) {
    const msg = { type, payload };
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  sendToHost(type, payload) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({ type, payload: { ...payload, socketId: this.myId } });
    }
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConnection = null;
    this.roomState = null;
  }
}

export const p2pManager = new P2PRoomManager();
