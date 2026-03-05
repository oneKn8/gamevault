import type { ServerMessage } from '@gamevault/rift-shared';
import { serializePlayer } from '@gamevault/rift-shared';
import type { RoomPhase, SerializedPlayer } from '@gamevault/rift-shared';
import { PlayerConnection } from './PlayerConnection.js';
import { GameSimulation } from './GameSimulation.js';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const COUNTDOWN_SECONDS = 3;

export class Room {
  code: string;
  gameId: string;
  phase: RoomPhase = 'waiting';
  players = new Map<string, PlayerConnection>();
  simulation: GameSimulation;
  createdAt = Date.now();
  lastActivity = Date.now();
  private colorIndex = 0;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotInterval: ReturnType<typeof setInterval> | null = null;

  onEmpty: (() => void) | null = null;

  constructor(code: string, gameId: string) {
    this.code = code;
    this.gameId = gameId;
    this.simulation = new GameSimulation();
  }

  addPlayer(conn: PlayerConnection): boolean {
    if (this.players.size >= MAX_PLAYERS) return false;
    if (this.phase !== 'waiting') return false;

    this.players.set(conn.id, conn);
    this.lastActivity = Date.now();

    // Notify all players
    this.broadcastRoomState();

    // Set up message handling
    conn.ws.on('message', (data) => {
      const msg = conn.handleMessage(data.toString());
      if (!msg) return;
      this.handleMessage(conn, msg);
    });

    conn.ws.on('close', () => {
      this.removePlayer(conn.id);
    });

    return true;
  }

  private handleMessage(conn: PlayerConnection, msg: import('@gamevault/rift-shared').ClientMessage): void {
    this.lastActivity = Date.now();

    switch (msg.type) {
      case 'READY':
        conn.ready = true;
        this.broadcastRoomState();
        this.checkAllReady();
        break;

      case 'INPUT':
        if (this.phase === 'playing') {
          conn.lastInput = msg.input;
          conn.lastInputSeq = msg.seq;
          this.simulation.setInput(conn.id, msg.input, msg.seq);
        }
        break;

      case 'LEAVE':
        this.removePlayer(conn.id);
        break;
    }
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.simulation.removePlayer(id);
    this.lastActivity = Date.now();

    if (this.players.size === 0) {
      this.cleanup();
      if (this.onEmpty) this.onEmpty();
      return;
    }

    this.broadcast({ type: 'PLAYER_LEAVE', playerId: id });

    if (this.phase === 'waiting') {
      this.broadcastRoomState();
    }
  }

  private checkAllReady(): void {
    if (this.players.size < MIN_PLAYERS) return;
    for (const [, p] of this.players) {
      if (!p.ready) return;
    }
    this.startCountdown();
  }

  private startCountdown(): void {
    this.phase = 'countdown';
    this.broadcastRoomState();

    this.countdownTimer = setTimeout(() => {
      this.startGame();
    }, COUNTDOWN_SECONDS * 1000);
  }

  private startGame(): void {
    this.phase = 'playing';
    this.colorIndex = 0;

    // Create players in simulation
    const serializedPlayers: SerializedPlayer[] = [];
    for (const [id, conn] of this.players) {
      const player = this.simulation.addPlayer(id, conn.username, this.colorIndex++);
      serializedPlayers.push(serializePlayer(player));
    }

    const anchors = this.simulation.state.anchors.map(a => ({
      id: a.id,
      x: a.position.x,
      y: a.position.y,
      dimension: a.dimension as 'light' | 'shadow',
      owner: a.owner,
      captureProgress: a.captureProgress,
      capturingPlayer: a.capturingPlayer,
    }));

    const portals = this.simulation.state.portals.map(p => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      radius: p.radius,
      active: p.active,
      timer: p.timer,
    }));

    // Send game start to each player with their ID
    for (const [id, conn] of this.players) {
      conn.send({
        type: 'GAME_START',
        players: serializedPlayers,
        anchors,
        portals,
        yourId: id,
      });
    }

    // Start simulation
    this.simulation.onGameOver = (winnerId) => {
      this.phase = 'finished';
      const scores: Record<string, number> = {};
      for (const [id, p] of this.simulation.state.players) {
        scores[id] = Math.floor(p.score);
      }
      this.broadcast({ type: 'GAME_OVER', winnerId, scores });
      this.stopSnapshots();
    };

    this.simulation.start();
    this.startSnapshots();
  }

  private startSnapshots(): void {
    // Send state snapshots at 20Hz
    this.snapshotInterval = setInterval(() => {
      for (const [id, conn] of this.players) {
        const snapshot = this.simulation.getSnapshot(id);
        conn.send({ type: 'STATE_SNAPSHOT', ...snapshot });
      }
    }, 50);
  }

  private stopSnapshots(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  private broadcastRoomState(): void {
    const players: SerializedPlayer[] = [];
    for (const [, conn] of this.players) {
      players.push({
        id: conn.id,
        x: 0, y: 0, vx: 0, vy: 0,
        dimension: 'light',
        health: 100, maxHealth: 100,
        phaseDebt: 0, phaseCooldown: 0, attackCooldown: 0,
        score: 0,
        color: '',
        username: conn.username,
        alive: true,
        aimAngle: 0,
        spawnShield: 0,
        ready: conn.ready,
      });
    }
    this.broadcast({ type: 'ROOM_STATE', players, roomCode: this.code, phase: this.phase });
  }

  private broadcast(msg: ServerMessage): void {
    for (const [, conn] of this.players) {
      conn.send(msg);
    }
  }

  cleanup(): void {
    this.simulation.stop();
    this.stopSnapshots();
    if (this.countdownTimer) clearTimeout(this.countdownTimer);
  }

  get playerCount(): number {
    return this.players.size;
  }

  isStale(): boolean {
    return Date.now() - this.lastActivity > 5 * 60 * 1000;
  }
}
