import type { Anchor, Dimension } from '@gamevault/rift-shared';
import { ANCHOR_RADIUS } from '@gamevault/rift-shared';

export class AnchorRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    anchor: Anchor,
    viewerDimension: Dimension,
    cameraX: number,
    cameraY: number,
    playerColors: Map<string, string>,
    time: number,
  ): void {
    const sx = anchor.position.x - cameraX;
    const sy = anchor.position.y - cameraY;
    const sameDim = anchor.dimension === viewerDimension;
    const alpha = sameDim ? 1 : 0.15;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Pentagon shape
    const sides = 5;
    const r = ANCHOR_RADIUS;
    const rotation = time * 0.3;

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = sx + Math.cos(angle) * r;
      const py = sy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Fill based on ownership
    const ownerColor = anchor.owner ? playerColors.get(anchor.owner) ?? '#888888' : null;

    if (anchor.dimension === 'shadow') {
      ctx.fillStyle = ownerColor ? `${ownerColor}44` : 'rgba(100,200,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = ownerColor ?? 'rgba(100,200,255,0.4)';
      ctx.lineWidth = 2;
      ctx.shadowColor = ownerColor ?? '#64C8FF';
      ctx.shadowBlur = sameDim ? 10 : 0;
      ctx.stroke();
    } else {
      ctx.fillStyle = ownerColor ? `${ownerColor}33` : 'rgba(0,0,0,0.04)';
      ctx.fill();
      ctx.strokeStyle = ownerColor ?? 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Capture progress arc
    if (anchor.captureProgress > 0 && anchor.captureProgress < 1 && sameDim) {
      const capColor = anchor.capturingPlayer
        ? playerColors.get(anchor.capturingPlayer) ?? '#FFFFFF'
        : ownerColor ?? '#FFFFFF';
      ctx.strokeStyle = capColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * anchor.captureProgress);
      ctx.stroke();
    }

    // Dimension indicator letter
    ctx.fillStyle = anchor.dimension === 'shadow' ? 'rgba(100,200,255,0.5)' : 'rgba(0,0,0,0.2)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(anchor.dimension === 'shadow' ? 'S' : 'L', sx, sy);

    ctx.restore();
  }
}
