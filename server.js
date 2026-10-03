import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { initSocketServer } from './src/server/socketServer.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  initSocketServer(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ludo Next.js Game Server running on http://${hostname}:${port}`);
  });
});
