import type { PlayerState, Dimension } from '@gamevault/rift-shared';
import { PLAYER_RADIUS } from '@gamevault/rift-shared';

export class PlayerRenderer {
  drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    viewerDimension: Dimension,
    cameraX: number,
    cameraY: number,
    isLocal: boolean,
    time: number,
  ): void {
    const sx = player.position.x - cameraX;
    const sy = player.position.y - cameraY;

    if (!player.alive) return;

    const sameDimension = player.dimension === viewerDimension;
    const alpha = sameDimension ? 1 : 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Player body
    if (player.dimension === 'shadow') {
      // Shadow dimension: neon glow
      ctx.shadowColor = player.color;
      ctx.shadowBlur = sameDimension ? 15 : 5;
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `${player.color}33`;
      ctx.fill();
    } else {
      // Light dimension: solid clean
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Aim indicator
    if (sameDimension) {
      const aimLen = PLAYER_RADIUS + 10;
      const ax = sx + Math.cos(player.aimAngle) * aimLen;
      const ay = sy + Math.sin(player.aimAngle) * aimLen;
      ctx.strokeStyle = player.dimension === 'shadow' ? player.color : 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        sx + Math.cos(player.aimAngle) * PLAYER_RADIUS,
        sy + Math.sin(player.aimAngle) * PLAYER_RADIUS,
      );
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }

    // Spawn shield visual
    if (player.spawnShield > 0 && sameDimension) {
      const shieldAlpha = 0.3 + Math.sin(time * 8) * 0.15;
      ctx.strokeStyle = `rgba(255,255,255,${shieldAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_RADIUS + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Local player ring
    if (isLocal) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Health bar (only for same-dimension players)
    if (sameDimension && player.health < player.maxHealth) {
      const barW = 30;
      const barH = 4;
      const barX = sx - barW / 2;
      const barY = sy - PLAYER_RADIUS - 10;
      const healthPct = player.health / player.maxHealth;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = healthPct > 0.3 ? '#4CAF50' : '#FF5252';
      ctx.fillRect(barX, barY, barW * healthPct, barH);
    }

    // Username
    if (sameDimension) {
      ctx.fillStyle = player.dimension === 'shadow' ? '#CCCCCC' : '#333333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, sx, sy - PLAYER_RADIUS - 14);
    }

    ctx.restore();

    // Draw echo
    if (player.echo && sameDimension) {
      this.drawEcho(ctx, player, cameraX, cameraY, time);
    }
  }

  private drawEcho(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    cameraX: number,
    cameraY: number,
    time: number,
  ): void {
    const echo = player.echo!;
    const ex = echo.position.x - cameraX;
    const ey = echo.position.y - cameraY;
    const lifePct = echo.lifetime / echo.maxLifetime;
    const pulse = 0.5 + Math.sin(time * 15) * 0.3;

    ctx.save();
    ctx.globalAlpha = lifePct * 0.6 * pulse;

    if (echo.dimension === 'shadow') {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 12;
    }

    ctx.strokeStyle = player.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(ex, ey, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
