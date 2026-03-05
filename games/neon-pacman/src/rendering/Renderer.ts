import { Vec2, Direction, GhostMode, GamePhase } from '../types';
import { BG_COLOR } from '../constants';
import { Layout } from '../world/Layout';
import { MazeRenderer } from './MazeRenderer';
import { PacmanRenderer } from './PacmanRenderer';
import { GhostRenderer } from './GhostRenderer';
import { ParticleSystem } from './ParticleSystem';
import { ScreenEffects } from './ScreenEffects';
import { HUDRenderer } from './HUDRenderer';

interface PacmanLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mouthAngle: number;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  readonly trail: Vec2[];
}

interface GhostLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mode: GhostMode;
  readonly name: string;
  readonly frightenedTimer: number;
}

export interface RenderState {
  layout: Layout;
  pacman: PacmanLike;
  ghosts: GhostLike[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  phase: GamePhase;
  deathProgress?: number;
}

export class Renderer {
  readonly mazeRenderer = new MazeRenderer();
  readonly pacmanRenderer = new PacmanRenderer();
  readonly ghostRenderer = new GhostRenderer();
  readonly particles = new ParticleSystem();
  readonly effects = new ScreenEffects();
  readonly hud = new HUDRenderer();

  private time = 0;

  render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    this.time += 1 / 60;

    const { width, height } = ctx.canvas;

    // 1. Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // 2. Screen shake
    ctx.save();
    this.effects.applyPre(ctx);

    // 3. Maze
    this.mazeRenderer.render(ctx, state.layout, this.time);

    // 4. Ghosts
    this.ghostRenderer.renderAll(ctx, state.ghosts, this.time);

    // 5. Pacman
    if (state.phase !== GamePhase.DYING || state.deathProgress !== undefined) {
      this.pacmanRenderer.render(
        ctx,
        state.pacman,
        this.time,
        state.deathProgress,
      );
    }

    // 6. Particles
    this.particles.render(ctx);

    ctx.restore();

    // 7. Flash overlay
    this.effects.applyPost(ctx, width, height);

    // 8. HUD
    this.hud.render(
      ctx,
      state.score,
      state.highScore,
      state.lives,
      state.level,
      width,
      height,
    );

    // 9. Phase overlays
    this.renderPhaseOverlay(ctx, state.phase, width, height);
  }

  private renderPhaseOverlay(
    ctx: CanvasRenderingContext2D,
    phase: GamePhase,
    w: number,
    h: number,
  ): void {
    let text: string | null = null;
    let color = '#ffffff';
    let pulse = false;

    switch (phase) {
      case GamePhase.READY:
        text = 'READY!';
        color = '#ffcc00';
        break;
      case GamePhase.GAME_OVER:
        text = 'GAME OVER';
        color = '#ff2222';
        break;
      case GamePhase.MENU:
        text = 'PRESS START';
        color = '#4488ff';
        pulse = true;
        break;
      default:
        return;
    }

    if (!text) return;

    ctx.save();

    ctx.font = '700 22px "Orbitron", "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    if (pulse) {
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 3) * 0.4;
    }

    const textY = h * 0.45;
    ctx.fillText(text, w / 2, textY);

    ctx.restore();
  }
}
