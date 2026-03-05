import { Vec2, Direction, GhostMode, GamePhase } from '../types';
import { BG_COLOR } from '../constants';
import { Layout } from '../world/Layout';
import { MazeRenderer } from './MazeRenderer';
import { PacmanRenderer } from './PacmanRenderer';
import { GhostRenderer } from './GhostRenderer';
import { ParticleSystem } from './ParticleSystem';
import { ScreenEffects } from './ScreenEffects';
import { HUDRenderer } from './HUDRenderer';

// ---------------------------------------------------------------------------
// Structural interfaces for entities consumed by the renderer.
// These keep the renderer decoupled from concrete entity classes.
// ---------------------------------------------------------------------------

/** Minimal Pacman surface required for rendering. */
interface PacmanLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mouthAngle: number;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  readonly trail: Vec2[];
}

/** Minimal ghost surface required for rendering. */
interface GhostLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mode: GhostMode;
  readonly name: string;
  readonly frightenedTimer: number;
}

/**
 * Complete game state snapshot passed to the renderer each frame.
 */
export interface RenderState {
  layout: Layout;
  pacman: PacmanLike;
  ghosts: GhostLike[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  phase: GamePhase;
  /** 0..1 progress through the death animation, if applicable. */
  deathProgress?: number;
}

/**
 * Master renderer that orchestrates every visual layer in the correct
 * draw order:
 *
 * 1. Background clear
 * 2. Screen shake transform
 * 3. Maze (walls, food, capsules)
 * 4. Ghosts
 * 5. Pacman
 * 6. Particles (additive, on top)
 * 7. Screen flash overlay
 * 8. HUD (unaffected by shake)
 * 9. Phase overlays (READY / GAME OVER text)
 *
 * Sub-renderers are exposed as public readonly fields so that game
 * code can call emitters (particles) and triggers (shake, flash)
 * directly.
 */
export class Renderer {
  readonly mazeRenderer = new MazeRenderer();
  readonly pacmanRenderer = new PacmanRenderer();
  readonly ghostRenderer = new GhostRenderer();
  readonly particles = new ParticleSystem();
  readonly effects = new ScreenEffects();
  readonly hud = new HUDRenderer();

  /** Monotonically increasing time counter for animation drivers. */
  private time = 0;

  /**
   * Draw a complete frame of the game.
   *
   * @param ctx   - The main canvas 2D context.
   * @param state - Snapshot of all game state needed for rendering.
   */
  render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    // Advance the internal clock. Assumes a fixed 60 fps timestep.
    this.time += 1 / 60;

    const { width, height } = ctx.canvas;

    // --- 1. Clear ---
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // --- 2. Screen shake ---
    ctx.save();
    this.effects.applyPre(ctx);

    // --- 3. Maze ---
    this.mazeRenderer.render(ctx, state.layout, this.time);

    // --- 4. Ghosts ---
    this.ghostRenderer.renderAll(ctx, state.ghosts, this.time);

    // --- 5. Pacman ---
    if (state.phase !== GamePhase.DYING || state.deathProgress !== undefined) {
      this.pacmanRenderer.render(
        ctx,
        state.pacman,
        this.time,
        state.deathProgress,
      );
    }

    // --- 6. Particles ---
    this.particles.render(ctx);

    ctx.restore();

    // --- 7. Flash overlay (not affected by shake) ---
    this.effects.applyPost(ctx, width, height);

    // --- 7.5. Vignette ---
    this.renderVignette(ctx, width, height);

    // --- 8. HUD (not affected by shake) ---
    this.hud.render(
      ctx,
      state.score,
      state.highScore,
      state.lives,
      state.level,
      width,
      height,
    );

    // --- 9. Phase overlays ---
    this.renderPhaseOverlay(ctx, state.phase, width, height);
  }

  // ---------------------------------------------------------------------------
  // Vignette
  // ---------------------------------------------------------------------------

  private renderVignette(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
  ): void {
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------------------
  // Phase overlay text
  // ---------------------------------------------------------------------------

  /**
   * Draw centred text overlays for non-playing game phases.
   *
   * - READY: large "READY!" in yellow with glow.
   * - GAME_OVER: large "GAME OVER" in red with glow.
   * - MENU: "PRESS START" prompt with a pulsing alpha.
   */
  private renderPhaseOverlay(
    ctx: CanvasRenderingContext2D,
    phase: GamePhase,
    w: number,
    h: number,
  ): void {
    let text: string | null = null;
    let color = '#ffffff';
    let glowColor = '#ffffff';
    let pulse = false;

    switch (phase) {
      case GamePhase.READY:
        text = 'READY!';
        color = '#ffdd00';
        glowColor = '#ffff44';
        break;
      case GamePhase.GAME_OVER:
        text = 'GAME OVER';
        color = '#ff2222';
        glowColor = '#ff4444';
        break;
      case GamePhase.MENU:
        text = 'PRESS START';
        color = '#4488ff';
        glowColor = '#6699ff';
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
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;

    if (pulse) {
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 3) * 0.4;
    }

    // Position the overlay text in the vertical centre of the maze area
    // (roughly half the canvas height, excluding the HUD bar at the bottom).
    const textY = h * 0.45;

    // Draw twice for a stronger glow bloom.
    ctx.fillText(text, w / 2, textY);
    ctx.fillText(text, w / 2, textY);

    ctx.restore();
  }
}
