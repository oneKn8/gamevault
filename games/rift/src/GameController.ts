import type { ArenaState, InputState, PlayerState } from '@gamevault/rift-shared';
import {
  createArenaState,
  createPlayer,
  simulateTick,
  resetRespawnTimers,
  TICK_INTERVAL,
} from '@gamevault/rift-shared';
import { getBotInput, clearBotBrains } from './BotAI';

export type GamePhase = 'title' | 'playing' | 'gameover';

const BOT_NAMES = [
  'Spectre', 'Wraith', 'Phantom', 'Echo', 'Shade',
  'Flicker', 'Dusk', 'Void', 'Prism', 'Flux',
];

export class GameController {
  phase: GamePhase = 'title';
  state: ArenaState = createArenaState();
  localPlayerId = 'local';
  private tickAccumulator = 0;
  private botIds: string[] = [];

  onPhaseShift: ((x: number, y: number, fromDim: string) => void) | null = null;
  onDamage: ((x: number, y: number) => void) | null = null;
  onCapture: ((x: number, y: number, color: string) => void) | null = null;
  onGameOver: ((winnerId: string) => void) | null = null;

  get localPlayer(): PlayerState | undefined {
    return this.state.players.get(this.localPlayerId);
  }

  startGame(): void {
    this.state = createArenaState();
    resetRespawnTimers();
    clearBotBrains();

    // Add local player
    const local = createPlayer(this.localPlayerId, 'You', 0);
    this.state.players.set(this.localPlayerId, local);

    // Add bots
    this.botIds = [];
    for (let i = 0; i < 4; i++) {
      const id = `bot_${i}`;
      const bot = createPlayer(id, BOT_NAMES[i], i + 1);
      this.state.players.set(id, bot);
      this.botIds.push(id);
    }

    this.phase = 'playing';
    this.tickAccumulator = 0;
  }

  update(dt: number, localInput: InputState): void {
    if (this.phase !== 'playing') return;

    this.tickAccumulator += dt;

    while (this.tickAccumulator >= TICK_INTERVAL) {
      // Gather all inputs
      const inputs = new Map<string, InputState>();
      inputs.set(this.localPlayerId, localInput);

      // Bot inputs
      for (const botId of this.botIds) {
        const bot = this.state.players.get(botId);
        if (bot) {
          inputs.set(botId, getBotInput(bot, this.state, TICK_INTERVAL));
        }
      }

      // Track pre-tick state for events
      const prevDimensions = new Map<string, string>();
      const prevHealth = new Map<string, number>();
      const prevOwners = this.state.anchors.map(a => a.owner);

      for (const [id, p] of this.state.players) {
        prevDimensions.set(id, p.dimension);
        prevHealth.set(id, p.health);
      }

      simulateTick(this.state, inputs, TICK_INTERVAL);

      // Emit events
      for (const [id, p] of this.state.players) {
        if (prevDimensions.get(id) !== p.dimension && this.onPhaseShift) {
          this.onPhaseShift(p.position.x, p.position.y, prevDimensions.get(id)!);
        }
        const prev = prevHealth.get(id) ?? p.maxHealth;
        if (p.health < prev && this.onDamage) {
          this.onDamage(p.position.x, p.position.y);
        }
      }

      for (let i = 0; i < this.state.anchors.length; i++) {
        const anchor = this.state.anchors[i];
        if (anchor.owner && anchor.owner !== prevOwners[i] && this.onCapture) {
          const ownerPlayer = this.state.players.get(anchor.owner);
          this.onCapture(anchor.position.x, anchor.position.y, ownerPlayer?.color ?? '#FFF');
        }
      }

      // Check win
      if (this.state.winner) {
        this.phase = 'gameover';
        if (this.onGameOver) this.onGameOver(this.state.winner);
        break;
      }

      this.tickAccumulator -= TICK_INTERVAL;
    }
  }

  reset(): void {
    this.startGame();
  }
}
