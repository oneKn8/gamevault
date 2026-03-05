import {
  Scene, Points, BufferGeometry, Float32BufferAttribute,
  PointsMaterial, Color, NormalBlending,
} from 'three';
import { MAX_PARTICLES } from './constants';

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  r: number; g: number; b: number;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private scene: Scene;
  private particles: Particle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private geometry: BufferGeometry;
  private points: Points;

  constructor(scene: Scene) {
    this.scene = scene;

    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new Float32BufferAttribute(this.sizes, 1));

    const material = new PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new Points(this.geometry, material);
    this.scene.add(this.points);
  }

  emitCollision(x: number, z: number, playerColors: number[]): void {
    const count = 60;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const colorHex = playerColors[i % playerColors.length];
      const c = new Color(colorHex);

      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI - Math.PI / 2;
      const speed = 2 + Math.random() * 6;

      this.particles.push({
        x, y: 0.3, z,
        vx: Math.cos(angle) * Math.cos(elevation) * speed,
        vy: 1 + Math.random() * 5,
        vz: Math.sin(angle) * Math.cos(elevation) * speed,
        r: c.r, g: c.g, b: c.b,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.2,
        size: 0.06 + Math.random() * 0.04,
      });
    }
  }

  emitCapture(x: number, z: number, color: number): void {
    const count = 12;
    const c = new Color(color);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: 0.2,
        z: z + (Math.random() - 0.5) * 0.4,
        vx: Math.cos(angle) * speed * 0.3,
        vy: 1 + Math.random() * 2,
        vz: Math.sin(angle) * speed * 0.3,
        r: c.r, g: c.g, b: c.b,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.1,
        size: 0.04 + Math.random() * 0.03,
      });
    }
  }

  emitVictory(centerX: number, centerZ: number): void {
    const count = 200;
    const victoryColors = [0x3b82f6, 0xef4444, 0x22c55e, 0xa855f7, 0xfbbf24, 0xffffff];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const colorHex = victoryColors[i % victoryColors.length];
      const c = new Color(colorHex);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;

      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 2,
        y: 0,
        z: centerZ + (Math.random() - 0.5) * 2,
        vx: Math.cos(angle) * speed,
        vy: 5 + Math.random() * 8,
        vz: Math.sin(angle) * speed,
        r: c.r, g: c.g, b: c.b,
        life: 1,
        maxLife: 1.5 + Math.random() * 0.5,
        size: 0.06 + Math.random() * 0.06,
      });
    }
  }

  update(dt: number): void {
    // Update particles (iterate backward for removal)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vy -= 9.8 * dt;
      p.vx *= 0.98;
      p.vz *= 0.98;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Floor bounce
      if (p.y < 0) {
        p.y = 0;
        p.vy *= -0.3;
      }
    }

    // Update buffers
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const alpha = Math.max(0, p.life);

        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        this.colors[i * 3] = p.r * alpha;
        this.colors[i * 3 + 1] = p.g * alpha;
        this.colors[i * 3 + 2] = p.b * alpha;

        this.sizes[i] = p.size * alpha;
      } else {
        this.positions[i * 3 + 1] = -100;
        this.sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    const mat = this.points.material as PointsMaterial;
    mat.opacity = this.particles.length > 0 ? 1 : 0;
  }
}
