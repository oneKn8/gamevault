import type { WebSocket } from 'ws';
import type { ClientMessage, ServerMessage } from '@gamevault/rift-shared';
import type { InputState } from '@gamevault/rift-shared';

export class PlayerConnection {
  id: string;
  username: string;
  ws: WebSocket;
  ready = false;
  lastInput: InputState = { moveX: 0, moveY: 0, aimAngle: 0, phaseShift: false, attack: false };
  lastInputSeq = 0;
  lastHeartbeat = Date.now();
  private messageCount = 0;
  private messageResetTime = Date.now();

  constructor(id: string, username: string, ws: WebSocket) {
    this.id = id;
    this.username = username;
    this.ws = ws;
  }

  send(msg: ServerMessage): void {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  handleMessage(raw: string): ClientMessage | null {
    // Rate limiting: max 60 messages per second
    const now = Date.now();
    if (now - this.messageResetTime > 1000) {
      this.messageCount = 0;
      this.messageResetTime = now;
    }
    this.messageCount++;
    if (this.messageCount > 60) return null;

    this.lastHeartbeat = now;

    try {
      return JSON.parse(raw) as ClientMessage;
    } catch {
      return null;
    }
  }

  isAlive(): boolean {
    return Date.now() - this.lastHeartbeat < 10000;
  }
}
