interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(x: number, y: number, count: number, color: string, spread: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.3 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
      });
    }
  }

  emitPhaseShift(x: number, y: number, fromDimension: string): void {
    const color = fromDimension === 'light' ? '#E0E0E0' : '#7C4DFF';
    const count = 25;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        size: 3 + Math.random() * 3,
        alpha: 1,
      });
    }
  }

  emitDamage(x: number, y: number): void {
    this.emit(x, y, 8, '#FF5252', 120);
  }

  emitCapture(x: number, y: number, color: string): void {
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const speed = 40 + Math.random() * 30;
      this.particles.push({
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color,
        size: 3,
        alpha: 1,
      });
    }
  }

  emitRespawn(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 100,
        vy: Math.sin(angle) * 100,
        life: 0.5,
        maxLife: 0.5,
        color: '#FFFFFF',
        size: 2 + Math.random() * 2,
        alpha: 1,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.99;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y - cameraY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
