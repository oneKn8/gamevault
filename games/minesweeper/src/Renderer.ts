import type { Difficulty, DifficultyConfig } from './types';
import { TileRenderer } from './TileRenderer';
import { TileAnimator } from './TileAnimator';
import { ParticleSystem } from './ParticleSystem';
import { GameController } from './GameController';
import { DIFFICULTIES, HEADER_HEIGHT, PADDING, BG } from './constants';

export class Renderer {
  tileRenderer: TileRenderer;
  tileAnimator: TileAnimator;
  particleSystem: ParticleSystem;
  hoverCell: { row: number; col: number } | null = null;

  constructor() {
    this.tileRenderer = new TileRenderer();
    this.tileAnimator = new TileAnimator();
    this.particleSystem = new ParticleSystem();
  }

  /** Calculate the total canvas dimensions for a given config. */
  getCanvasSize(config: DifficultyConfig): { width: number; height: number } {
    const width = config.cols * config.cellSize + PADDING * 2;
    const height = config.rows * config.cellSize + HEADER_HEIGHT + PADDING * 2;
    return { width, height };
  }

  /** Draw the main menu with title and difficulty buttons. */
  drawMenu(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Subtle animated gradient overlay
    const grad = ctx.createRadialGradient(w / 2, h / 3, 0, w / 2, h / 3, w * 0.6);
    grad.addColorStop(0, 'rgba(33, 150, 243, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    const titleY = h * 0.25;
    const pulse = 0.8 + Math.sin(time * 2) * 0.2;

    ctx.save();
    ctx.font = "900 36px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2196F3';
    ctx.shadowColor = '#2196F3';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillText('MINESWEEPER', w / 2, titleY);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Subtitle
    ctx.font = "400 14px 'Orbitron', sans-serif";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Select Difficulty', w / 2, titleY + 50);

    // Difficulty buttons
    const buttonW = 200;
    const buttonH = 44;
    const buttonGap = 16;
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert'];
    const startY = h * 0.45;

    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i];
      const config = DIFFICULTIES[diff];
      const bx = (w - buttonW) / 2;
      const by = startY + i * (buttonH + buttonGap);

      // Button background
      ctx.fillStyle = '#1a1a2a';
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, bx, by, buttonW, buttonH, 6);
      ctx.fill();
      ctx.stroke();

      // Button text
      ctx.font = "600 14px 'Orbitron', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.name, w / 2, by + buttonH / 2 - 6);

      // Details
      ctx.font = "400 10px 'Orbitron', sans-serif";
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(
        `${config.cols}x${config.rows} / ${config.mines} mines`,
        w / 2,
        by + buttonH / 2 + 10
      );
    }

    // Pulsing prompt at bottom
    const promptAlpha = 0.3 + Math.sin(time * 3) * 0.2;
    ctx.font = "400 11px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
    ctx.textAlign = 'center';
    ctx.fillText('Click a difficulty to begin', w / 2, h * 0.88);
  }

  /** Draw the gameplay screen: header + grid + particles. */
  drawGame(ctx: CanvasRenderingContext2D, controller: GameController, w: number, h: number, _time: number): void {
    const config = controller.getConfig();
    if (!config || !controller.board) return;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Header
    this.drawHeader(ctx, controller, w);

    // Grid
    const gridX = PADDING;
    const gridY = HEADER_HEIGHT + PADDING;

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const cell = controller.board.getCell(r, c);
        if (!cell) continue;

        const cellX = gridX + c * config.cellSize;
        const cellY = gridY + r * config.cellSize;
        const isHover =
          this.hoverCell !== null &&
          this.hoverCell.row === r &&
          this.hoverCell.col === c &&
          cell.state === 'hidden' &&
          controller.phase === 'playing';

        const animScale = this.tileAnimator.getScale(r, c);
        this.tileRenderer.draw(ctx, cell, cellX, cellY, config.cellSize, isHover, animScale);
      }
    }

    // Particles on top
    this.particleSystem.draw(ctx);
  }

  /** Draw the header bar with mine counter, smiley face, and timer. */
  private drawHeader(ctx: CanvasRenderingContext2D, controller: GameController, w: number): void {
    // Header background
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, w, HEADER_HEIGHT);

    // Bottom border
    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.fillRect(0, HEADER_HEIGHT - 1, w, 1);

    const centerY = HEADER_HEIGHT / 2;

    // Mine counter (left)
    const remaining = controller.board
      ? controller.board.mineCount - controller.board.getFlagCount()
      : 0;
    ctx.font = "700 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f44336';
    ctx.shadowColor = '#f44336';
    ctx.shadowBlur = 6;
    ctx.fillText(String(remaining).padStart(3, '0'), PADDING + 4, centerY);
    ctx.shadowBlur = 0;

    // Status face (center)
    const faceSize = 28;
    const faceX = w / 2;
    this.drawFace(ctx, faceX, centerY, faceSize, controller.phase);

    // Timer (right)
    ctx.font = "700 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4CAF50';
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 6;
    ctx.fillText(controller.timer.getDisplay(), w - PADDING - 4, centerY);
    ctx.shadowBlur = 0;
  }

  /** Draw a simple smiley/dead face as the status indicator. */
  private drawFace(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    phase: string
  ): void {
    const r = size / 2;

    ctx.save();

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes
    const eyeY = y - r * 0.2;
    const eyeSpacing = r * 0.35;
    ctx.fillStyle = '#000';

    if (phase === 'lost') {
      // X eyes
      const ex = r * 0.12;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
      for (const side of [-1, 1]) {
        const eyeX = x + side * eyeSpacing;
        ctx.beginPath();
        ctx.moveTo(eyeX - ex, eyeY - ex);
        ctx.lineTo(eyeX + ex, eyeY + ex);
        ctx.moveTo(eyeX + ex, eyeY - ex);
        ctx.lineTo(eyeX - ex, eyeY + ex);
        ctx.stroke();
      }
    } else if (phase === 'won') {
      // Happy squint eyes
      for (const side of [-1, 1]) {
        const eyeX = x + side * eyeSpacing;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, r * 0.12, Math.PI, 0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();
      }
    } else {
      // Normal dot eyes
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(x + side * eyeSpacing, eyeY, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouth
    const mouthY = y + r * 0.25;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (phase === 'lost') {
      // Frown
      ctx.arc(x, mouthY + r * 0.25, r * 0.3, Math.PI + 0.5, -0.5);
    } else if (phase === 'won') {
      // Big smile
      ctx.arc(x, mouthY - r * 0.1, r * 0.35, 0.3, Math.PI - 0.3);
    } else {
      // Neutral smile
      ctx.arc(x, mouthY, r * 0.25, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    ctx.restore();
  }

  /** Draw the game-over overlay (win or loss). */
  drawGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    won: boolean,
    score: number,
    time: number
  ): void {
    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const centerY = h / 2;
    const pulse = 0.8 + Math.sin(time * 3) * 0.2;

    // Title
    ctx.save();
    ctx.font = "900 32px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (won) {
      ctx.fillStyle = '#4CAF50';
      ctx.shadowColor = '#4CAF50';
      ctx.shadowBlur = 20 * pulse;
      ctx.fillText('YOU WIN!', w / 2, centerY - 40);
    } else {
      ctx.fillStyle = '#f44336';
      ctx.shadowColor = '#f44336';
      ctx.shadowBlur = 20 * pulse;
      ctx.fillText('GAME OVER', w / 2, centerY - 40);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // Score (only for wins)
    if (won) {
      ctx.font = "600 18px 'Orbitron', sans-serif";
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(`Score: ${score}`, w / 2, centerY + 10);
    }

    // Restart prompt
    const promptAlpha = 0.4 + Math.sin(time * 4) * 0.3;
    ctx.font = "400 13px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
    ctx.textAlign = 'center';
    ctx.fillText('Click or press R to restart', w / 2, centerY + 55);
  }

  /**
   * Convert mouse coordinates to a grid cell position.
   * Returns null if the click is outside the grid.
   */
  getClickedCell(
    mouseX: number,
    mouseY: number,
    config: DifficultyConfig
  ): { row: number; col: number } | null {
    const gridX = PADDING;
    const gridY = HEADER_HEIGHT + PADDING;

    const col = Math.floor((mouseX - gridX) / config.cellSize);
    const row = Math.floor((mouseY - gridY) / config.cellSize);

    if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) return null;
    return { row, col };
  }

  /**
   * Determine which difficulty button was clicked on the menu screen.
   * Returns null if no button was hit.
   */
  getDifficultyAtPoint(
    mouseX: number,
    mouseY: number,
    w: number,
    h: number
  ): Difficulty | null {
    const buttonW = 200;
    const buttonH = 44;
    const buttonGap = 16;
    const startY = h * 0.45;
    const bx = (w - buttonW) / 2;

    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert'];

    for (let i = 0; i < difficulties.length; i++) {
      const by = startY + i * (buttonH + buttonGap);
      if (mouseX >= bx && mouseX <= bx + buttonW && mouseY >= by && mouseY <= by + buttonH) {
        return difficulties[i];
      }
    }

    return null;
  }

  /** Helper to draw a rounded rectangle path. */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
