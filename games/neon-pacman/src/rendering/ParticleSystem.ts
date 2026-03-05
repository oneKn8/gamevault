import { Vec2 } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'circle' | 'text';
  text?: string;
  alpha?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private readonly maxParticles = 500;

  update(dt: number): void {
    const gravity = 40;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'circle') {
        p.vy += gravity * dt;
      } else {
        p.vy *= 0.97;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    for (const p of this.particles) {
      const lifeFrac = p.life / p.maxLife;
      const alpha = p.alpha !== undefined ? p.alpha * lifeFrac : lifeFrac;

      ctx.globalAlpha = Math.max(alpha, 0);

      if (p.type === 'text') {
        ctx.font = `${Math.round(p.size)}px "Press Start 2P", "Courier New", monospace`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text ?? '', p.x, p.y);
      } else {
        const radius = p.size * lifeFrac;
        if (radius > 0.2) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
  }

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

  emitGhostEat(pos: Vec2, color: string, score: number): void {
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
        color: Math.random() > 0.5 ? '#ffffff' : '#ffddcc',
        size: 2.5 + Math.random() * 2,
        type: 'circle',
      });
    }
  }

  clear(): void {
    this.particles.length = 0;
  }

  private addParticle(p: Particle): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(p);
  }
}
