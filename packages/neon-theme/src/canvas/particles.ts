export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/** Create a burst of particles at a position */
export function createBurst(
  x: number,
  y: number,
  count: number,
  color: string,
  speed: number = 100,
  life: number = 0.5,
  size: number = 3,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const v = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life,
      maxLife: life,
      size: size * (0.5 + Math.random() * 0.5),
      color,
    });
  }
  return particles;
}

/** Update particles, returns only living particles */
export function updateParticles(particles: Particle[], dt: number): Particle[] {
  const alive: Particle[] = [];
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    if (p.life > 0) alive.push(p);
  }
  return alive;
}

/** Render particles with additive blending */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
