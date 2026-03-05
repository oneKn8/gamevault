import type { ArenaState, PlayerState, Dimension, Projectile } from '@gamevault/rift-shared';
import { PROJECTILE_RADIUS, RIFT_PORTAL_RADIUS } from '@gamevault/rift-shared';
import { ArenaRenderer } from './ArenaRenderer';
import { PlayerRenderer } from './PlayerRenderer';
import { AnchorRenderer } from './AnchorRenderer';
import { ParticleSystem } from './ParticleSystem';
import { HUD } from './HUD';

export class Renderer {
  private arenaRenderer = new ArenaRenderer();
  private playerRenderer = new PlayerRenderer();
  private anchorRenderer = new AnchorRenderer();
  private hud = new HUD();

  drawGame(
    ctx: CanvasRenderingContext2D,
    state: ArenaState,
    localPlayer: PlayerState,
    particles: ParticleSystem,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
    time: number,
  ): void {
    const dim = localPlayer.dimension;

    // Arena background + grid
    this.arenaRenderer.draw(ctx, dim, cameraX, cameraY, viewW, viewH);

    // Rift portals
    for (const portal of state.portals) {
      this.drawPortal(ctx, portal.position.x, portal.position.y, portal.radius, portal.active, cameraX, cameraY, time);
    }

    // Anchors
    const playerColors = new Map<string, string>();
    for (const [id, p] of state.players) {
      playerColors.set(id, p.color);
    }
    for (const anchor of state.anchors) {
      this.anchorRenderer.draw(ctx, anchor, dim, cameraX, cameraY, playerColors, time);
    }

    // Projectiles
    for (const proj of state.projectiles) {
      this.drawProjectile(ctx, proj, dim, cameraX, cameraY);
    }

    // Players (other dimension first, then same dimension for proper layering)
    for (const [, player] of state.players) {
      if (player.dimension === dim) continue;
      this.playerRenderer.drawPlayer(ctx, player, dim, cameraX, cameraY, player.id === localPlayer.id, time);
    }
    for (const [, player] of state.players) {
      if (player.dimension !== dim) continue;
      this.playerRenderer.drawPlayer(ctx, player, dim, cameraX, cameraY, player.id === localPlayer.id, time);
    }

    // Particles
    particles.draw(ctx, cameraX, cameraY);

    // HUD (screen-space, no camera offset)
    this.hud.draw(ctx, state, localPlayer, viewW, viewH, time);
  }

  drawTitle(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, time: number): void {
    // Dark background
    ctx.fillStyle = '#0D0D1A';
    ctx.fillRect(0, 0, viewW, viewH);

    // Subtle grid
    ctx.strokeStyle = 'rgba(100,200,255,0.04)';
    ctx.lineWidth = 1;
    const offset = (time * 10) % 60;
    ctx.beginPath();
    for (let x = -60 + offset; x < viewW + 60; x += 60) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewH);
    }
    for (let y = -60 + offset; y < viewH + 60; y += 60) {
      ctx.moveTo(0, y);
      ctx.lineTo(viewW, y);
    }
    ctx.stroke();

    // Title
    const pulse = 0.8 + Math.sin(time * 2) * 0.2;
    ctx.save();
    ctx.shadowColor = '#7C4DFF';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = '#B388FF';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RIFT', viewW / 2, viewH / 2 - 40);
    ctx.restore();

    ctx.fillStyle = '#8888AA';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Phase-Shift Arena', viewW / 2, viewH / 2 + 5);

    ctx.fillStyle = '#666688';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD to move | SPACE to phase-shift | Mouse to aim & shoot', viewW / 2, viewH / 2 + 50);

    const blink = Math.sin(time * 3) > 0;
    if (blink) {
      ctx.fillStyle = '#AAAACC';
      ctx.font = '14px sans-serif';
      ctx.fillText('Press SPACE to start', viewW / 2, viewH / 2 + 85);
    }
  }

  drawGameOver(ctx: CanvasRenderingContext2D, winnerName: string, isLocalWinner: boolean, viewW: number, viewH: number, time: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    if (isLocalWinner) {
      ctx.shadowColor = '#7C4DFF';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#B388FF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VICTORY', viewW / 2, viewH / 2 - 20);
    } else {
      ctx.fillStyle = '#FF5252';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DEFEAT', viewW / 2, viewH / 2 - 20);
    }
    ctx.restore();

    ctx.fillStyle = '#CCCCCC';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Winner: ${winnerName}`, viewW / 2, viewH / 2 + 15);

    const blink = Math.sin(time * 3) > 0;
    if (blink) {
      ctx.fillStyle = '#999';
      ctx.font = '13px sans-serif';
      ctx.fillText('Press SPACE to play again', viewW / 2, viewH / 2 + 50);
    }
  }

  private drawPortal(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, radius: number,
    active: boolean,
    cameraX: number, cameraY: number,
    time: number,
  ): void {
    const sx = x - cameraX;
    const sy = y - cameraY;

    if (!active) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    const swirl = time * 2;
    ctx.save();

    // Outer glow
    ctx.shadowColor = '#E040FB';
    ctx.shadowBlur = 15 + Math.sin(time * 4) * 5;

    // Swirl lines
    ctx.strokeStyle = '#CE93D8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const startAngle = swirl + (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, startAngle, startAngle + Math.PI * 0.6);
      ctx.stroke();
    }

    // Center
    ctx.fillStyle = 'rgba(224,64,251,0.15)';
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawProjectile(
    ctx: CanvasRenderingContext2D,
    proj: Projectile,
    viewerDim: Dimension,
    cameraX: number,
    cameraY: number,
  ): void {
    if (proj.dimension !== viewerDim) return;
    const sx = proj.position.x - cameraX;
    const sy = proj.position.y - cameraY;

    ctx.save();
    if (viewerDim === 'shadow') {
      ctx.shadowColor = '#FF5252';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = viewerDim === 'shadow' ? '#FF8A80' : '#555';
    ctx.beginPath();
    ctx.arc(sx, sy, PROJECTILE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
