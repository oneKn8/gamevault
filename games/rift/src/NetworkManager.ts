import type {
  ClientMessage,
  ServerMessage,
  InputState,
  SerializedPlayer,
  SerializedAnchor,
  SerializedProjectile,
  SerializedPortal,
  RoomPhase,
} from '@gamevault/rift-shared';

type EventMap = {
  roomState: (players: SerializedPlayer[], roomCode: string, phase: RoomPhase) => void;
  gameStart: (players: SerializedPlayer[], anchors: SerializedAnchor[], portals: SerializedPortal[], yourId: string) => void;
  snapshot: (tick: number, time: number, players: SerializedPlayer[], anchors: SerializedAnchor[], projectiles: SerializedProjectile[], portals: SerializedPortal[], lastInput: number) => void;
  playerJoin: (player: SerializedPlayer) => void;
  playerLeave: (playerId: string) => void;
  gameOver: (winnerId: string, scores: Record<string, number>) => void;
  error: (message: string) => void;
  disconnect: () => void;
  connected: () => void;
};

export class NetworkManager {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnects = 3;
  private inputSeq = 0;
  private listeners = new Map<string, Function[]>();
  private roomCode = '';
  private username = '';
  connected = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  connect(roomCode: string, username: string): void {
    this.roomCode = roomCode;
    this.username = username;
    this.doConnect();
  }

  private doConnect(): void {
    const wsUrl = this.serverUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Send join
      this.send({ type: 'JOIN_ROOM', roomCode: this.roomCode, username: this.username });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.handleMessage(msg);
      } catch {
        // ignore malformed
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.emit('disconnect');

      if (this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        setTimeout(() => this.doConnect(), 1000 * this.reconnectAttempts);
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after
    };
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'ROOM_STATE':
        this.emit('roomState', msg.players, msg.roomCode, msg.phase);
        break;
      case 'GAME_START':
        this.emit('gameStart', msg.players, msg.anchors, msg.portals, msg.yourId);
        break;
      case 'STATE_SNAPSHOT':
        this.emit('snapshot', msg.tick, msg.time, msg.players, msg.anchors, msg.projectiles, msg.portals, msg.lastProcessedInput);
        break;
      case 'PLAYER_JOIN':
        this.emit('playerJoin', msg.player);
        break;
      case 'PLAYER_LEAVE':
        this.emit('playerLeave', msg.playerId);
        break;
      case 'GAME_OVER':
        this.emit('gameOver', msg.winnerId, msg.scores);
        break;
      case 'ERROR':
        this.emit('error', msg.message);
        break;
    }
  }

  sendInput(input: InputState): number {
    this.inputSeq++;
    this.send({ type: 'INPUT', input, seq: this.inputSeq });
    return this.inputSeq;
  }

  sendReady(): void {
    this.send({ type: 'READY' });
  }

  sendLeave(): void {
    this.send({ type: 'LEAVE' });
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const h of handlers) (h as Function)(...args);
    }
  }

  disconnect(): void {
    this.maxReconnects = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
