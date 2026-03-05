import {
  Scene,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Color,
  AdditiveBlending,
} from 'three';
import type { BlockPosition } from './types';

const MAX_PARTICLES = 600;

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

/** GPU-accelerated particle system using THREE.Points for visual effects. */
export class ParticleSystem3D {
  private particles: Particle[] = [];
  private points: Points | null = null;
  private geometry: BufferGeometry;
  private material: PointsMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private scene: Scene | null = null;

  constructor() {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new Float32BufferAttribute(this.colors, 3));

    this.material = new PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  /** Add the particle system to the scene. */
  addToScene(scene: Scene): void {
    this.scene = scene;
    if (this.points) {
      scene.add(this.points);
    }
  }

  /** Emit a burst of particles at the given block positions. */
  emit(blockPositions: BlockPosition[], color: number): void {
    const c = new Color(color);
    const particlesPerBlock = Math.floor(MAX_PARTICLES / Math.max(blockPositions.length * 2, 1));
    const count = Math.min(particlesPerBlock, 20);

    for (const pos of blockPositions) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= MAX_PARTICLES) {
          // Remove oldest particle
          this.particles.shift();
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        const upSpeed = Math.random() * 4 + 1;

        this.particles.push({
          x: pos.x + 0.5 + (Math.random() - 0.5) * 0.5,
          y: pos.y + 0.5 + (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.5 + upSpeed,
          vz: (Math.random() - 0.5) * 4,
          life: 1.0,
          maxLife: 0.6 + Math.random() * 0.6,
        });
      }
    }
  }

  /** Update particle positions and lifetimes. dt in seconds. */
  update(dt: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Gravity
      p.vy -= 9.8 * dt;

      // Drag
      p.vx *= 0.98;
      p.vz *= 0.98;
    }

    // Update buffers
    const posAttr = this.geometry.getAttribute('position') as BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as BufferAttribute;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        // Fade color with life
        const fade = Math.max(0, p.life);
        this.colors[i * 3] = fade;
        this.colors[i * 3 + 1] = fade;
        this.colors[i * 3 + 2] = fade;
      } else {
        // Hide unused particles by placing far away
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -100;
        this.positions[i * 3 + 2] = 0;
        this.colors[i * 3] = 0;
        this.colors[i * 3 + 1] = 0;
        this.colors[i * 3 + 2] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Update material opacity based on particle count
    this.material.opacity = this.particles.length > 0 ? 0.9 : 0;
  }

  /** Remove and clean up resources. */
  dispose(): void {
    if (this.scene && this.points) {
      this.scene.remove(this.points);
    }
    this.geometry.dispose();
    this.material.dispose();
    this.particles = [];
  }
}
