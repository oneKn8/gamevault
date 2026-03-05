import { Vec2 } from '../types';

/**
 * A single particle tracked by the system.
 *
 * Particles are lightweight value objects -- no methods, just data.
 * The system mutates them in-place during {@link ParticleSystem.update}.
 */
interface Particle {
  /** Current x position in pixels. */
  x: number;
  /** Current y position in pixels. */
  y: number;
  /** Horizontal velocity (pixels / second). */
  vx: number;
  /** Vertical velocity (pixels / second). */
  vy: number;
  /** Seconds remaining before this particle is dead. */
  life: number;
  /** Total lifespan (used to compute the life fraction for fading). */
  maxLife: number;
  /** CSS fill/stroke colour. */
  color: string;
  /** Radius (circle) or font size (text). */
  size: number;
  /** Visual shape. `text` particles display a score string. */
  type: 'circle' | 'text';
  /** Display string when `type === 'text'`. */
  text?: string;
  /** Optional explicit alpha override (0..1). */
  alpha?: number;
}

/**
 * Pool-based particle system with additive blending for neon glow effects.
 *
 * All rendering uses `globalCompositeOperation = 'lighter'` so that
 * overlapping bright particles bloom convincingly against the dark
 * background.
 *
 * The particle pool has a hard cap ({@link maxParticles}) to prevent
 * runaway allocation if many events fire in quick succession.
 */
export class ParticleSystem {
  /** Live particle pool. */
  private particles: Particle[] = [];

  /** Maximum number of concurrent particles. Oldest are evicted when full. */
  private readonly maxParticles = 500;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Advance every particle by `dt` seconds.
   *
   * - Velocity is applied to position.
   * - A slight downward gravity pull is added to circle particles.
   * - Life is decremented; dead particles are pruned.
   */
  update(dt: number): void {
    const gravity = 40; // pixels / s^2

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= dt;
      if (p.life <= 0) {
        // Fast unordered removal.
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'circle') {
        p.vy += gravity * dt;
      } else {
        // Text particles float upward and slow down.
        p.vy *= 0.97;
      }
    }
  }

  /**
   * Draw every live particle onto the provided context.
   *
   * Uses additive blending (`lighter`) for the characteristic neon bloom.
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const lifeFrac = p.life / p.maxLife; // 1 = just born, 0 = about to die
      const alpha = p.alpha !== undefined ? p.alpha * lifeFrac : lifeFrac;

      ctx.globalAlpha = Math.max(alpha, 0);

      if (p.type === 'text') {
        ctx.font = `${Math.round(p.size)}px "Press Start 2P", "Courier New", monospace`;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillText(p.text ?? '', p.x, p.y);
      } else {
        const radius = p.size * lifeFrac;
        if (radius > 0.2) {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = prevComposite;
  }

  // ---------------------------------------------------------------------------
  // Emitters
  // ---------------------------------------------------------------------------

  /**
   * Spawn 4 tiny white/yellow sparks when a food dot is eaten.
   */
  emitDotEat(pos: Vec2): void {
    const colors = ['#ffeeaa', '#ffffff', '#ffdd66', '#ffffcc'];
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
      const speed = 20 + Math.random() * 30;
      this.addParticle({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color: colors[i % colors.length],
        size: 1.5 + Math.random(),
        type: 'circle',
      });
    }
  }

  /**
   * Spawn 16 coloured sparks plus a floating score number when a ghost
   * is eaten.
   *
   * @param pos - Position of the eaten ghost.
   * @param color - The ghost's body colour (for spark tinting).
   * @param score - The score value to display as floating text.
   */
  emitGhostEat(pos: Vec2, color: string, score: number): void {
    // Coloured sparks.
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 60;
      this.addParticle({
        x: pos.x + (Math.random() - 0.5) * 4,
        y: pos.y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 2.5 + Math.random() * 1.5,
        type: 'circle',
      });
    }

    // Floating score text.
    this.addParticle({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: -50,
      life: 1.2,
      maxLife: 1.2,
      color: '#ffffff',
      size: 14,
      type: 'text',
      text: String(score),
      alpha: 1,
    });
  }

  /**
   * Spawn 24 radial yellow/orange particles for Pacman's death burst.
   */
  emitDeath(pos: Vec2): void {
    const colors = ['#ffdd00', '#ffaa00', '#ff6600', '#ffff44'];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.2;
      const speed = 50 + Math.random() * 80;
      this.addParticle({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 2,
        type: 'circle',
      });
    }
  }

  /**
   * Spawn 20 white particles with wider spread when a power capsule
   * is consumed.
   */
  emitCapsule(pos: Vec2): void {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.addParticle({
        x: pos.x + (Math.random() - 0.5) * 8,
        y: pos.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? '#ffffff' : '#ffddff',
        size: 2.5 + Math.random() * 2,
        type: 'circle',
      });
    }
  }

  /**
   * Remove all live particles immediately.
   */
  clear(): void {
    this.particles.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Add a particle to the pool, evicting the oldest if the cap is reached.
   */
  private addParticle(p: Particle): void {
    if (this.particles.length >= this.maxParticles) {
      // Overwrite the oldest (first) particle.
      this.particles.shift();
    }
    this.particles.push(p);
  }
}
