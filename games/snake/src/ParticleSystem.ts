import type { Particle, GridPosition } from './types';
import { CELL, HUD_HEIGHT } from './constants';

/**
 * Manages particle effects: eat bursts, movement trails, and
 * sequential death explosions along the snake body.
 */
export class ParticleSystem {
  particles: Particle[];

  /** Pending chain explosion segments (queued for staggered detonation). */
  private chainQueue: GridPosition[];
  private chainColor: string;
  private chainDelay: number;
  private chainTimer: number;

  constructor() {
    this.particles = [];
    this.chainQueue = [];
    this.chainColor = '#00ff88';
    this.chainDelay = 0.03;
    this.chainTimer = 0;
  }

  /**
   * Emit a burst of particles at a world-pixel position.
   * @param x - Pixel X coordinate.
   * @param y - Pixel Y coordinate.
   * @param count - Number of particles to spawn.
   * @param color - CSS color string.
   * @param speed - Maximum initial velocity.
   */
  emit(x: number, y: number, count: number, color: string, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed + speed * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  /**
   * Emit a small trail effect (1-2 particles) behind the snake head.
   * @param x - Pixel X.
   * @param y - Pixel Y.
   * @param color - CSS color string.
   */
  emitTrail(x: number, y: number, color: string): void {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        color,
        size: 1 + Math.random() * 1.5,
      });
    }
  }

  /**
   * Start a chain explosion that detonates sequentially along the snake
   * body from head to tail, creating a dramatic death effect.
   */
  chainExplosion(segments: GridPosition[]): void {
    this.chainQueue = segments.map((s) => ({ ...s }));
    this.chainColor = '#00ff88';
    this.chainTimer = 0;
  }

  /** Advance all particles and process chain explosion queue. */
  update(dt: number): void {
    // Process chain explosions.
    if (this.chainQueue.length > 0) {
      this.chainTimer += dt;
      while (this.chainTimer >= this.chainDelay && this.chainQueue.length > 0) {
        this.chainTimer -= this.chainDelay;
        const seg = this.chainQueue.shift()!;
        const px = seg.x * CELL + CELL / 2;
        const py = seg.y * CELL + CELL / 2 + HUD_HEIGHT;
        this.emit(px, py, 8, this.chainColor, 120);
        // Fade color toward red along the body.
        const ratio = 1 - this.chainQueue.length / (this.chainQueue.length + 1);
        const r = Math.floor(0 + ratio * 255);
        const g = Math.floor(255 - ratio * 180);
        const b = Math.floor(136 - ratio * 68);
        this.chainColor = `rgb(${r},${g},${b})`;
      }
    }

    // Update existing particles.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /** Draw all live particles with glow effects. */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
