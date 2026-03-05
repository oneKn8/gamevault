import { createServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import { RoomManager } from './RoomManager.js';
import { PlayerConnection } from './PlayerConnection.js';
import { handleApiRequest } from './api.js';
import type { ClientMessage } from '@gamevault/rift-shared';

const PORT = parseInt(process.env.PORT ?? '3100', 10);

const roomManager = new RoomManager();

const server = createServer((req, res) => {
  if (handleApiRequest(req, res, roomManager)) return;

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let joined = false;

  const timeout = setTimeout(() => {
    if (!joined) ws.close(4000, 'No JOIN_ROOM within 5s');
  }, 5000);

  ws.on('message', (data) => {
    if (joined) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      ws.close(4001, 'Invalid message');
      return;
    }

    if (msg.type !== 'JOIN_ROOM') {
      ws.close(4002, 'First message must be JOIN_ROOM');
      return;
    }

    clearTimeout(timeout);
    joined = true;

    const room = roomManager.getRoom(msg.roomCode);
    if (!room) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
      ws.close(4003, 'Room not found');
      return;
    }

    const playerId = nanoid(8);
    const conn = new PlayerConnection(playerId, msg.username, ws);

    if (!room.addPlayer(conn)) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full or game in progress' }));
      ws.close(4004, 'Cannot join room');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  roomManager.destroy();
  server.close();
  process.exit(0);
});
