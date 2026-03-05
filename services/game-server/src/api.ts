import type { IncomingMessage, ServerResponse } from 'http';
import type { RoomManager } from './RoomManager.js';

export function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  roomManager: RoomManager,
): boolean {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // POST /rooms - create a room
  if (req.method === 'POST' && path === '/rooms') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { gameId } = JSON.parse(body);
        if (!gameId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'gameId required' }));
          return;
        }
        const room = roomManager.createRoom(gameId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: room.code, gameId: room.gameId }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return true;
  }

  // GET /rooms?gameId=rift - list rooms
  if (req.method === 'GET' && path === '/rooms') {
    const gameId = url.searchParams.get('gameId') ?? undefined;
    const rooms = roomManager.listRooms(gameId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms }));
    return true;
  }

  // GET /rooms/:code - room info
  const roomMatch = path.match(/^\/rooms\/([A-Z0-9]+)$/i);
  if (req.method === 'GET' && roomMatch) {
    const room = roomManager.getRoom(roomMatch[1]);
    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Room not found' }));
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: room.code,
      gameId: room.gameId,
      playerCount: room.playerCount,
      phase: room.phase,
    }));
    return true;
  }

  // Health check
  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return true;
  }

  return false;
}
