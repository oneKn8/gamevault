import type { GamePhase, PlayerID } from './types';
import { PLAYER_CSS_COLORS, PLAYER_NAMES } from './constants';

export class HUD {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(
    phase: GamePhase,
    turn: number,
    territoryCounts: Map<PlayerID, number>,
    totalTiles: number,
    winTarget: number,
    winner: PlayerID | null,
    playerCount: number,
    planTimeRemaining: number | null,
    selectedPieceId: number | null,
    unplannedCount: number,
  ): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (phase === 'settings') return;

    if (phase === 'gameOver') {
      this.drawGameOver(winner, territoryCounts, totalTiles);
      return;
    }

    // Turn counter (top-left)
    this.ctx.font = '600 16px Orbitron, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Turn ${turn}`, 20, 32);

    // Phase indicator (top-center)
    const phaseText = this.getPhaseText(phase);
    this.ctx.font = '700 20px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    const pulse = phase === 'planning'
      ? 0.7 + Math.sin(performance.now() / 500) * 0.3
      : 1;
    this.ctx.globalAlpha = pulse;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(phaseText, this.width / 2, 32);
    this.ctx.globalAlpha = 1;

    // Plan timer (below phase indicator)
    if (planTimeRemaining !== null && planTimeRemaining > 0 && phase === 'planning') {
      this.ctx.font = '400 14px Orbitron, sans-serif';
      this.ctx.fillStyle = planTimeRemaining <= 5 ? '#ef4444' : '#aaaacc';
      this.ctx.fillText(`${Math.ceil(planTimeRemaining)}s`, this.width / 2, 54);
    }

    // Planning instructions
    if (phase === 'planning') {
      this.ctx.font = '400 12px Orbitron, sans-serif';
      this.ctx.fillStyle = '#8888aa';
      this.ctx.textAlign = 'center';

      if (unplannedCount > 0) {
        this.ctx.fillText(
          `Click adjacent tiles to plan moves (${unplannedCount} piece${unplannedCount > 1 ? 's' : ''} remaining)`,
          this.width / 2,
          this.height - 40,
        );
        this.ctx.fillText('Press ENTER when ready', this.width / 2, this.height - 20);
      } else {
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText('All moves planned! Press ENTER to execute', this.width / 2, this.height - 30);
      }
    }

    // Territory bars (bottom)
    this.drawTerritoryBars(territoryCounts, totalTiles, winTarget, playerCount);
  }

  private drawTerritoryBars(
    counts: Map<PlayerID, number>,
    total: number,
    winTarget: number,
    playerCount: number,
  ): void {
    const barWidth = Math.min(300, this.width - 40);
    const barHeight = 12;
    const barX = (this.width - barWidth) / 2;
    const startY = this.height - 60 - (playerCount * 22);

    for (let p = 0; p < playerCount; p++) {
      const pid = p as PlayerID;
      const count = counts.get(pid) || 0;
      const pct = total > 0 ? count / total : 0;
      const y = startY + p * 22;

      // Label
      this.ctx.font = '400 10px Orbitron, sans-serif';
      this.ctx.fillStyle = PLAYER_CSS_COLORS[p];
      this.ctx.textAlign = 'right';
      this.ctx.fillText(PLAYER_NAMES[p], barX - 8, y + barHeight - 1);

      // Background bar
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.fillRect(barX, y, barWidth, barHeight);

      // Fill bar
      this.ctx.fillStyle = PLAYER_CSS_COLORS[p];
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillRect(barX, y, barWidth * pct, barHeight);
      this.ctx.globalAlpha = 1;

      // Win target line
      const targetX = barX + barWidth * (winTarget / 100);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(targetX, y);
      this.ctx.lineTo(targetX, y + barHeight);
      this.ctx.stroke();

      // Percentage text
      this.ctx.font = '400 9px Orbitron, sans-serif';
      this.ctx.fillStyle = '#ccccdd';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${Math.round(pct * 100)}%`, barX + barWidth + 6, y + barHeight - 1);
    }
  }

  private drawGameOver(
    winner: PlayerID | null,
    territoryCounts: Map<PlayerID, number>,
    totalTiles: number,
  ): void {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Winner text
    const winnerName = winner !== null ? PLAYER_NAMES[winner] : 'Nobody';
    const winnerColor = winner !== null ? PLAYER_CSS_COLORS[winner] : '#ffffff';

    this.ctx.font = '900 36px Orbitron, sans-serif';
    this.ctx.fillStyle = winnerColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${winnerName} Wins!`, this.width / 2, this.height / 2 - 40);

    // Score summary
    this.ctx.font = '400 16px Orbitron, sans-serif';
    this.ctx.fillStyle = '#aaaacc';
    if (winner !== null) {
      const count = territoryCounts.get(winner) || 0;
      const pct = totalTiles > 0 ? Math.round((count / totalTiles) * 100) : 0;
      this.ctx.fillText(`${pct}% territory captured`, this.width / 2, this.height / 2 + 10);
    }

    // Restart prompt
    const pulse = 0.5 + Math.sin(performance.now() / 500) * 0.5;
    this.ctx.globalAlpha = pulse;
    this.ctx.font = '400 14px Orbitron, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('PRESS ENTER TO PLAY AGAIN', this.width / 2, this.height / 2 + 60);
    this.ctx.globalAlpha = 1;
  }

  private getPhaseText(phase: GamePhase): string {
    switch (phase) {
      case 'planning': return 'PLANNING';
      case 'reveal': return 'REVEALING';
      case 'resolving': return 'RESOLVING';
      case 'gameOver': return 'GAME OVER';
      default: return '';
    }
  }
}
