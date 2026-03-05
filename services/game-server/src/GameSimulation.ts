import type { ArenaState, InputState, PlayerState } from '@gamevault/rift-shared';
import {
  createArenaState,
  createPlayer,
  simulateTick,
  resetRespawnTimers,
  TICK_INTERVAL,
  TICK_RATE,
  serializePlayer,
  type SerializedPlayer,
  type SerializedAnchor,
  type SerializedProjectile,
  type SerializedPortal,
} from '@gamevault/rift-shared';

export class GameSimulation {
  state: ArenaState;
  private inputs = new Map<string, InputState>();
  private inputSeqs = new Map<string, number>();
  private interval: ReturnType<typeof setInterval> | null = null;
  onTick: ((state: ArenaState) => void) | null = null;
  onGameOver: ((winnerId: string) => void) | null = null;

  constructor() {
    this.state = createArenaState();
  }

  addPlayer(id: string, username: string, colorIndex: number): PlayerState {
    const player = createPlayer(id, username, colorIndex);
    this.state.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.state.players.delete(id);
    this.inputs.delete(id);
    this.inputSeqs.delete(id);
  }

  setInput(playerId: string, input: InputState, seq: number): void {
    this.inputs.set(playerId, input);
    this.inputSeqs.set(playerId, seq);
  }

  getLastInputSeq(playerId: string): number {
    return this.inputSeqs.get(playerId) ?? 0;
  }

  start(): void {
    resetRespawnTimers();
    this.interval = setInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick(): void {
    simulateTick(this.state, this.inputs, TICK_INTERVAL);

    if (this.onTick) this.onTick(this.state);

    if (this.state.winner && this.onGameOver) {
      this.onGameOver(this.state.winner);
      this.stop();
    }
  }

  getSnapshot(forPlayerId: string) {
    const players: SerializedPlayer[] = [];
    for (const [, p] of this.state.players) {
      players.push(serializePlayer(p));
    }

    const anchors: SerializedAnchor[] = this.state.anchors.map(a => ({
      id: a.id,
      x: a.position.x,
      y: a.position.y,
      dimension: a.dimension,
      owner: a.owner,
      captureProgress: a.captureProgress,
      capturingPlayer: a.capturingPlayer,
    }));

    const projectiles: SerializedProjectile[] = this.state.projectiles.map(p => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      vx: p.velocity.x,
      vy: p.velocity.y,
      dimension: p.dimension,
      ownerId: p.ownerId,
      damage: p.damage,
      lifetime: p.lifetime,
    }));

    const portals: SerializedPortal[] = this.state.portals.map(p => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      radius: p.radius,
      active: p.active,
      timer: p.timer,
    }));

    return {
      tick: this.state.tick,
      time: this.state.time,
      players,
      anchors,
      projectiles,
      portals,
      lastProcessedInput: this.getLastInputSeq(forPlayerId),
    };
  }
}
