import { ARENA_WIDTH, ARENA_HEIGHT } from '@gamevault/rift-shared';
import type { Dimension } from '@gamevault/rift-shared';

export class ArenaRenderer {
  draw(ctx: CanvasRenderingContext2D, dimension: Dimension, cameraX: number, cameraY: number, viewW: number, viewH: number): void {
    // Background
    if (dimension === 'light') {
      ctx.fillStyle = '#F5F0E8';
      ctx.fillRect(0, 0, viewW, viewH);
    } else {
      ctx.fillStyle = '#0D0D1A';
      ctx.fillRect(0, 0, viewW, viewH);
    }

    // Grid
    const gridSize = 60;
    const startX = -(cameraX % gridSize);
    const startY = -(cameraY % gridSize);

    ctx.strokeStyle = dimension === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(100,200,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < viewW; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
    }
    for (let y = startY; y < viewH; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewW, y);
    }
    ctx.stroke();

    // Arena boundary
    const bx = -cameraX;
    const by = -cameraY;
    if (dimension === 'light') {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = 'rgba(0,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 10;
    }
    ctx.strokeRect(bx, by, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.shadowBlur = 0;
  }
}
