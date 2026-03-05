import type { PlayerState, ArenaState, Anchor } from '@gamevault/rift-shared';
import {
  WIN_SCORE,
  PHASE_SHIFT_COOLDOWN,
  PHASE_DEBT_MAX,
  ARENA_WIDTH,
  ARENA_HEIGHT,
} from '@gamevault/rift-shared';

export class HUD {
  draw(
    ctx: CanvasRenderingContext2D,
    state: ArenaState,
    localPlayer: PlayerState,
    viewW: number,
    viewH: number,
    time: number,
  ): void {
    ctx.save();

    this.drawScoreboard(ctx, state, localPlayer, viewW);
    this.drawPhaseDebt(ctx, localPlayer, viewW, viewH);
    this.drawCooldowns(ctx, localPlayer, viewW, viewH);
    this.drawDimensionIndicator(ctx, localPlayer, viewW);
    this.drawMinimap(ctx, state, localPlayer, viewW, viewH);

    if (!localPlayer.alive) {
      this.drawDeathOverlay(ctx, viewW, viewH);
    }

    ctx.restore();
  }

  private drawScoreboard(ctx: CanvasRenderingContext2D, state: ArenaState, localPlayer: PlayerState, viewW: number): void {
    // Top-center score
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const boxW = 180;
    const boxH = 36;
    const bx = (viewW - boxW) / 2;
    ctx.beginPath();
    ctx.roundRect(bx, 8, boxW, boxH, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(localPlayer.score)} / ${WIN_SCORE}`, viewW / 2, 26);

    // Anchors owned count
    let owned = 0;
    for (const anchor of state.anchors) {
      if (anchor.owner === localPlayer.id) owned++;
    }
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#AAA';
    ctx.fillText(`Anchors: ${owned}`, viewW / 2, 40);
  }

  private drawPhaseDebt(ctx: CanvasRenderingContext2D, player: PlayerState, viewW: number, viewH: number): void {
    const barW = 150;
    const barH = 8;
    const x = 16;
    const y = viewH - 50;
    const pct = player.phaseDebt / PHASE_DEBT_MAX;

    // Label
    ctx.fillStyle = pct > 0.7 ? '#FF5252' : '#CCCCCC';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Phase Debt', x, y - 4);

    // Bar bg
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 3);
    ctx.fill();

    // Bar fill
    const color = pct > 0.7 ? '#FF5252' : pct > 0.4 ? '#FFC107' : '#7C4DFF';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, barW * pct, barH, 3);
    ctx.fill();
  }

  private drawCooldowns(ctx: CanvasRenderingContext2D, player: PlayerState, viewW: number, viewH: number): void {
    const x = 16;
    const y = viewH - 26;

    // Phase shift cooldown
    const phasePct = player.phaseCooldown / PHASE_SHIFT_COOLDOWN;
    ctx.fillStyle = phasePct > 0 ? '#666' : '#7C4DFF';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';

    if (phasePct > 0) {
      ctx.fillText(`[SPACE] Phase: ${player.phaseCooldown.toFixed(1)}s`, x, y);
    } else {
      ctx.fillText('[SPACE] Phase: READY', x, y);
    }
  }

  private drawDimensionIndicator(ctx: CanvasRenderingContext2D, player: PlayerState, viewW: number): void {
    const x = viewW - 100;
    const y = 16;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, 84, 28, 6);
    ctx.fill();

    if (player.dimension === 'light') {
      ctx.fillStyle = '#FFF8E1';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIGHT', x + 42, y + 15);
    } else {
      ctx.fillStyle = '#B388FF';
      ctx.shadowColor = '#7C4DFF';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHADOW', x + 42, y + 15);
      ctx.shadowBlur = 0;
    }
  }

  private drawMinimap(
    ctx: CanvasRenderingContext2D,
    state: ArenaState,
    localPlayer: PlayerState,
    viewW: number,
    viewH: number,
  ): void {
    const size = 100;
    const mx = viewW - size - 12;
    const my = viewH - size - 12;
    const scale = size / ARENA_WIDTH;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(mx, my, size, size, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, size, size);

    // Anchors
    for (const anchor of state.anchors) {
      if (anchor.dimension !== localPlayer.dimension) continue;
      const ax = mx + anchor.position.x * scale;
      const ay = my + anchor.position.y * scale;
      ctx.fillStyle = anchor.owner
        ? (state.players.get(anchor.owner)?.color ?? '#888')
        : 'rgba(255,255,255,0.3)';
      ctx.fillRect(ax - 2, ay - 2, 4, 4);
    }

    // Players
    for (const [, p] of state.players) {
      if (!p.alive || p.dimension !== localPlayer.dimension) continue;
      const px = mx + p.position.x * scale;
      const py = my + p.position.y * scale;
      ctx.fillStyle = p.id === localPlayer.id ? '#FFFFFF' : p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.id === localPlayer.id ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawDeathOverlay(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = '#FF5252';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ELIMINATED', viewW / 2, viewH / 2 - 10);
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '14px sans-serif';
    ctx.fillText('Respawning...', viewW / 2, viewH / 2 + 16);
  }
}
