import { io } from 'socket.io-client';

let socket = null;

// On Vercel the Next.js app is serverless and cannot host WebSockets, so the realtime
// server runs separately (see realtime-server.js). Point to it with NEXT_PUBLIC_SOCKET_URL.
// When unset (local `npm run dev`), the socket connects to the same origin.
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 8000
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (s && !s.connected && !s.active) {
    s.connect();
  } else if (s && !s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
