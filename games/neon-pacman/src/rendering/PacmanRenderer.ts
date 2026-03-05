import { Direction, Vec2 } from '../types';
import { TILE_SIZE, PACMAN_COLOR, PACMAN_COLOR_LIGHT } from '../constants';

interface PacmanLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mouthAngle: number;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  readonly trail: Vec2[];
}

export class PacmanRenderer {
  private static readonly RADIUS = TILE_SIZE * 0.45;

  render(
    ctx: CanvasRenderingContext2D,
    pacman: PacmanLike,
    time: number,
    deathProgress?: number,
  ): void {
    if (pacman.invulnerable && Math.floor(time * 10) % 2 === 0) {
      return;
    }

    if (deathProgress !== undefined && deathProgress >= 0) {
      this.renderDeath(ctx, pacman, deathProgress);
      return;
    }

    if (!pacman.alive) return;

    const { startAngle, endAngle } = PacmanRenderer.mouthAngles(
      pacman.dir,
      pacman.mouthAngle,
    );

    const { x, y } = pacman.pos;
    const r = PacmanRenderer.RADIUS;

    // Radial gradient fill
    const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, PACMAN_COLOR_LIGHT);
    grad.addColorStop(0.6, PACMAN_COLOR);
    grad.addColorStop(1, '#cc9900');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  }

  private renderDeath(
    ctx: CanvasRenderingContext2D,
    pacman: PacmanLike,
    deathProgress: number,
  ): void {
    const progress = Math.min(Math.max(deathProgress, 0), 1);
    const mouthOpening = pacman.mouthAngle + progress * (Math.PI - pacman.mouthAngle);
    const radius = PacmanRenderer.RADIUS * (1 - progress);

    if (radius <= 0.5) return;

    const { startAngle, endAngle } = PacmanRenderer.mouthAngles(
      pacman.dir,
      mouthOpening,
    );

    const { x, y } = pacman.pos;

    ctx.fillStyle = PACMAN_COLOR;
    ctx.globalAlpha = 1 - progress * 0.4;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private static mouthAngles(
    dir: Direction,
    mouthAngle: number,
  ): { startAngle: number; endAngle: number } {
    let baseAngle: number;

    switch (dir) {
      case Direction.RIGHT:
        baseAngle = 0;
        break;
      case Direction.DOWN:
        baseAngle = Math.PI / 2;
        break;
      case Direction.LEFT:
        baseAngle = Math.PI;
        break;
      case Direction.UP:
        baseAngle = -Math.PI / 2;
        break;
      default:
        baseAngle = 0;
        break;
    }

    return {
      startAngle: baseAngle + mouthAngle,
      endAngle: baseAngle - mouthAngle + Math.PI * 2,
    };
  }
}
