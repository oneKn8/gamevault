import type {
  PlayerState,
  ArenaState,
  InputState,
  Anchor,
  RiftPortal,
  Projectile,
  SerializedPlayer,
  SerializedAnchor,
  SerializedProjectile,
  SerializedPortal,
} from '@gamevault/rift-shared';
import { deserializePlayer, ECHO_DAMAGE_MULTIPLIER } from '@gamevault/rift-shared';

interface PendingInput {
  seq: number;
  input: InputState;
}

export class Prediction {
  private pendingInputs: PendingInput[] = [];
  private interpolationBuffer: Map<string, { prev: SerializedPlayer; next: SerializedPlayer; t: number }> = new Map();
  private bufferTime = 0.1; // 100ms interpolation buffer

  addInput(seq: number, input: InputState): void {
    this.pendingInputs.push({ seq, input });
    // Cap buffer size
    if (this.pendingInputs.length > 120) {
      this.pendingInputs = this.pendingInputs.slice(-60);
    }
  }

  reconcile(lastProcessedInput: number): void {
    this.pendingInputs = this.pendingInputs.filter(p => p.seq > lastProcessedInput);
  }

  applyServerState(
    state: ArenaState,
    players: SerializedPlayer[],
    anchors: SerializedAnchor[],
    projectiles: SerializedProjectile[],
    portals: SerializedPortal[],
    localPlayerId: string,
  ): void {
    // Update anchors
    for (const sa of anchors) {
      const anchor = state.anchors.find(a => a.id === sa.id);
      if (anchor) {
        anchor.position.x = sa.x;
        anchor.position.y = sa.y;
        anchor.dimension = sa.dimension;
        anchor.owner = sa.owner;
        anchor.captureProgress = sa.captureProgress;
        anchor.capturingPlayer = sa.capturingPlayer;
      }
    }

    // Update portals
    for (const sp of portals) {
      const portal = state.portals.find(p => p.id === sp.id);
      if (portal) {
        portal.position.x = sp.x;
        portal.position.y = sp.y;
        portal.radius = sp.radius;
        portal.active = sp.active;
        portal.timer = sp.timer;
      }
    }

    // Update projectiles directly
    state.projectiles = projectiles.map(sp => ({
      id: sp.id,
      position: { x: sp.x, y: sp.y },
      velocity: { x: sp.vx, y: sp.vy },
      dimension: sp.dimension,
      ownerId: sp.ownerId,
      damage: sp.damage,
      lifetime: sp.lifetime,
    }));

    // Update remote players with interpolation targets
    for (const sp of players) {
      if (sp.id === localPlayerId) {
        // Apply server state directly to local player
        const local = state.players.get(localPlayerId);
        if (local) {
          const serverState = deserializePlayer(sp);
          Object.assign(local, serverState);
        }
        continue;
      }

      // Remote player: update interpolation buffer
      const existing = state.players.get(sp.id);
      if (existing) {
        const prev: SerializedPlayer = {
          ...sp,
          x: existing.position.x,
          y: existing.position.y,
          vx: existing.velocity.x,
          vy: existing.velocity.y,
          aimAngle: existing.aimAngle,
        };
        this.interpolationBuffer.set(sp.id, { prev, next: sp, t: 0 });

        // Update non-positional state immediately
        existing.dimension = sp.dimension;
        existing.health = sp.health;
        existing.phaseDebt = sp.phaseDebt;
        existing.score = sp.score;
        existing.alive = sp.alive;
        existing.color = sp.color;
        existing.username = sp.username;

        if (sp.echoX !== undefined) {
          existing.echo = {
            position: { x: sp.echoX, y: sp.echoY! },
            dimension: sp.echoDim!,
            lifetime: sp.echoLife!,
            maxLifetime: sp.echoMaxLife!,
            damageMultiplier: ECHO_DAMAGE_MULTIPLIER,
            aimAngle: sp.aimAngle,
          };
        } else {
          existing.echo = null;
        }
      } else {
        // New player
        state.players.set(sp.id, deserializePlayer(sp));
      }
    }

    // Remove players not in snapshot
    const serverIds = new Set(players.map(p => p.id));
    for (const [id] of state.players) {
      if (!serverIds.has(id)) {
        state.players.delete(id);
        this.interpolationBuffer.delete(id);
      }
    }
  }

  interpolateRemotePlayers(state: ArenaState, localPlayerId: string, dt: number): void {
    for (const [id, buf] of this.interpolationBuffer) {
      if (id === localPlayerId) continue;
      const player = state.players.get(id);
      if (!player) continue;

      buf.t = Math.min(buf.t + dt / this.bufferTime, 1);
      const t = buf.t;

      player.position.x = buf.prev.x + (buf.next.x - buf.prev.x) * t;
      player.position.y = buf.prev.y + (buf.next.y - buf.prev.y) * t;
      player.aimAngle = buf.prev.aimAngle + (buf.next.aimAngle - buf.prev.aimAngle) * t;
    }
  }
}
