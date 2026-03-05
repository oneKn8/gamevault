import type { Difficulty, DifficultyConfig } from './types';
import { TileRenderer } from './TileRenderer';
import { TileAnimator } from './TileAnimator';
import { ParticleSystem } from './ParticleSystem';
import { GameController } from './GameController';
import {
  DIFFICULTIES,
  HEADER_HEIGHT,
  PADDING,
  FIELD_BG,
  HEADER_BG,
  BEVEL_LIGHT,
  BEVEL_MID,
  BEVEL_DARK,
  BEVEL_DARKEST,
  LCD_BG,
  LCD_MINE_COLOR,
  LCD_TIMER_COLOR,
} from './constants';

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

  /**
   * Draw the main menu.
   * Background: classic raised-tile pattern (mini tile grid) using solid fills only.
   * No gradients, no shadowBlur.
   */
  drawMenu(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // Background - classic gray
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(0, 0, w, h);

    // Draw a minesweeper tile pattern as background texture
    // Tiny raised tiles in a grid to evoke the game feel
    const tileSize = 24;
    for (let ty = 0; ty < h; ty += tileSize) {
      for (let tx = 0; tx < w; tx += tileSize) {
        // Tile face
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(tx, ty, tileSize - 1, tileSize - 1);
        // Top/left bright edge
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(tx, ty, tileSize - 1, 2);
        ctx.fillRect(tx, ty, 2, tileSize - 1);
        // Bottom/right dark edge
        ctx.fillStyle = '#808080';
        ctx.fillRect(tx, ty + tileSize - 3, tileSize - 1, 2);
        ctx.fillRect(tx + tileSize - 3, ty, 2, tileSize - 1);
      }
    }

    // Center panel - raised card for title area, solid fills only
    const panelW = Math.min(w - 48, 320);
    const panelH = 280;
    const panelX = (w - panelW) / 2;
    const panelY = h * 0.12;

    // Panel outer shadow (1px dark offset)
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(panelX + 3, panelY + 3, panelW, panelH);

    // Panel body
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // Panel bevel - raised look
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(panelX, panelY, panelW, 3);
    ctx.fillRect(panelX, panelY, 3, panelH);

    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(panelX, panelY + panelH - 3, panelW, 3);
    ctx.fillRect(panelX + panelW - 3, panelY, 3, panelH);

    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(panelX + 3, panelY + 3, panelW - 6, 1);
    ctx.fillRect(panelX + 3, panelY + 3, 1, panelH - 6);

    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(panelX + 3, panelY + panelH - 4, panelW - 6, 1);
    ctx.fillRect(panelX + panelW - 4, panelY + 3, 1, panelH - 6);

    // Mine icon decorative - draw a small mine centered in top area
    const mineIconX = panelX + panelW / 2 - 22;
    const mineIconY = panelY + 22;
    this.tileRenderer.drawMineIcon(ctx, mineIconX, mineIconY, 44, 44);

    // Title text - solid dark blue, no shadow
    const titleY = panelY + 88;
    ctx.font = "900 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1565C0';
    ctx.fillText('MINESWEEPER', w / 2, titleY);

    // Divider line under title - solid
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(panelX + 20, titleY + 18, panelW - 40, 1);
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(panelX + 20, titleY + 19, panelW - 40, 1);

    // Subtitle
    ctx.font = "400 10px 'Orbitron', sans-serif";
    ctx.fillStyle = '#555555';
    ctx.fillText('Choose Difficulty', w / 2, titleY + 34);

    // Difficulty buttons inside the panel
    const buttonW = panelW - 48;
    const buttonH = 40;
    const buttonGap = 10;
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert'];
    const buttonsStartY = titleY + 56;

    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i];
      const config = DIFFICULTIES[diff];
      const bx = panelX + 24;
      const by = buttonsStartY + i * (buttonH + buttonGap);

      this.drawRaisedButton(ctx, bx, by, buttonW, buttonH);

      // Button label
      ctx.font = "700 12px 'Orbitron', sans-serif";
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.name.toUpperCase(), bx + buttonW / 2, by + buttonH / 2 - 7);

      // Details line
      ctx.font = "400 9px 'Orbitron', sans-serif";
      ctx.fillStyle = '#555555';
      ctx.fillText(
        `${config.cols} x ${config.rows}  |  ${config.mines} mines`,
        bx + buttonW / 2,
        by + buttonH / 2 + 9
      );
    }

    // Pulsing prompt below the card
    const promptAlpha = 0.45 + Math.sin(time * 3) * 0.3;
    ctx.font = "400 10px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(80, 80, 80, ${promptAlpha})`;
    ctx.textAlign = 'center';
    ctx.fillText('Click a difficulty to begin', w / 2, panelY + panelH + 28);
  }

  /** Draw a classic raised button with 2-layer bevel. No gradients. */
  private drawRaisedButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // Drop shadow
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 2, y + 2, w, h);

    // Face
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x, y, w, h);

    // Outer bevel
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x + w - 2, y, 2, h);

    // Inner bevel
    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  }

  /** Draw the gameplay screen: header + grid + particles. */
  drawGame(ctx: CanvasRenderingContext2D, controller: GameController, w: number, h: number, _time: number): void {
    const config = controller.getConfig();
    if (!config || !controller.board) return;

    // Background - classic gray
    ctx.fillStyle = FIELD_BG;
    ctx.fillRect(0, 0, w, h);

    // Header
    this.drawHeader(ctx, controller, w);

    // Grid sunken panel border (the whole grid area is sunken)
    const gridX = PADDING;
    const gridY = HEADER_HEIGHT + PADDING;
    const gridW = config.cols * config.cellSize;
    const gridH = config.rows * config.cellSize;

    // Sunken outer edge around the grid
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(gridX - 3, gridY - 3, gridW + 6, 3);          // top
    ctx.fillRect(gridX - 3, gridY - 3, 3, gridH + 6);          // left
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(gridX - 3, gridY + gridH, gridW + 6, 3);      // bottom
    ctx.fillRect(gridX + gridW, gridY - 3, 3, gridH + 6);      // right

    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(gridX - 2, gridY - 2, gridW + 4, 1);
    ctx.fillRect(gridX - 2, gridY - 2, 1, gridH + 4);
    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(gridX - 2, gridY + gridH + 1, gridW + 4, 1);
    ctx.fillRect(gridX + gridW + 1, gridY - 2, 1, gridH + 4);

    // Find which mine was hit (if game lost)
    let hitMinePos: { r: number; c: number } | null = null;
    if (controller.phase === 'lost') {
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          const cell = controller.board.getCell(r, c);
          if (cell && cell.mine && cell.state === 'revealed') {
            // First revealed mine is the one that was hit
            hitMinePos = { r, c };
            break;
          }
        }
        if (hitMinePos) break;
      }
    }

    // Grid tiles
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

        const isHitMine = hitMinePos !== null && hitMinePos.r === r && hitMinePos.c === c;
        const animScale = this.tileAnimator.getScale(r, c);
        this.tileRenderer.draw(ctx, cell, cellX, cellY, config.cellSize, isHover, animScale, isHitMine);
      }
    }

    // Particles on top
    this.particleSystem.draw(ctx);
  }

  /**
   * Draw the header bar.
   * Classic Windows Minesweeper header: raised outer panel, sunken LCD counters,
   * smiley face button in center. All solid fills, no gradients, no shadowBlur.
   */
  private drawHeader(ctx: CanvasRenderingContext2D, controller: GameController, w: number): void {
    // Header panel - same gray as body
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(0, 0, w, HEADER_HEIGHT);

    // Raised border around full header area
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, 0, 2, HEADER_HEIGHT);
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(0, HEADER_HEIGHT - 2, w, 2);
    ctx.fillRect(w - 2, 0, 2, HEADER_HEIGHT);

    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(2, 2, w - 4, 1);
    ctx.fillRect(2, 2, 1, HEADER_HEIGHT - 4);
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(2, HEADER_HEIGHT - 3, w - 4, 1);
    ctx.fillRect(w - 3, 2, 1, HEADER_HEIGHT - 4);

    // Inner divider line (sunken top of inner area)
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(PADDING - 2, 8, w - PADDING * 2 + 4, 1);
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(PADDING - 2, 9, w - PADDING * 2 + 4, 1);

    const centerY = HEADER_HEIGHT / 2 + 2;
    const lcdH = 32;
    const lcdW = 68;
    const lcdY = centerY - lcdH / 2;

    // Mine counter (left)
    const remaining = controller.board
      ? controller.board.mineCount - controller.board.getFlagCount()
      : 0;

    this.drawLCDPanel(ctx, PADDING, lcdY, lcdW, lcdH);

    ctx.font = "700 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = LCD_MINE_COLOR;
    ctx.fillText(String(Math.max(0, remaining)).padStart(3, '0'), PADDING + lcdW / 2, centerY);

    // Smiley face button (center)
    const faceSize = 30;
    const faceX = w / 2;
    this.drawFaceButton(ctx, faceX, centerY, faceSize, controller.phase);

    // Timer (right)
    this.drawLCDPanel(ctx, w - PADDING - lcdW, lcdY, lcdW, lcdH);

    ctx.font = "700 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = LCD_TIMER_COLOR;
    ctx.fillText(controller.timer.getDisplay(), w - PADDING - lcdW / 2, centerY);
  }

  /**
   * Draw an LCD-style sunken panel. No gradients.
   * Sunken bevel: dark top-left edges, bright bottom-right.
   */
  private drawLCDPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    // Outer shadow inset
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(x, y, w, h);

    // Sunken bevel - dark top-left
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);

    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);

    // Sunken bevel - bright bottom-right
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x + w - 2, y, 2, h);

    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  }

  /**
   * Draw the smiley face inside a raised square button.
   * Classic Windows Minesweeper style. No gradients, no shadowBlur.
   */
  private drawFaceButton(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    phase: string
  ): void {
    const half = size / 2;
    const bx = cx - half;
    const by = cy - half;

    // Raised square button
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(bx, by, size, size);

    // Button bevel - raised
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(bx, by, size, 2);
    ctx.fillRect(bx, by, 2, size);
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(bx, by + size - 2, size, 2);
    ctx.fillRect(bx + size - 2, by, 2, size);
    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(bx + 2, by + 2, size - 4, 1);
    ctx.fillRect(bx + 2, by + 2, 1, size - 4);
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(bx + 2, by + size - 3, size - 4, 1);
    ctx.fillRect(bx + size - 3, by + 2, 1, size - 4);

    const r = (size - 8) / 2;
    const fx = cx;
    const fy = cy;

    // Face circle - yellow, solid
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // Face outline
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    const eyeY = fy - r * 0.2;
    const eyeSpacing = r * 0.38;
    ctx.fillStyle = '#000000';

    if (phase === 'lost') {
      // X eyes
      const ex = r * 0.13;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      for (const side of [-1, 1]) {
        const ex2 = fx + side * eyeSpacing;
        ctx.beginPath();
        ctx.moveTo(ex2 - ex, eyeY - ex);
        ctx.lineTo(ex2 + ex, eyeY + ex);
        ctx.moveTo(ex2 + ex, eyeY - ex);
        ctx.lineTo(ex2 - ex, eyeY + ex);
        ctx.stroke();
      }
    } else if (phase === 'won') {
      // Happy squint arcs
      for (const side of [-1, 1]) {
        const ex2 = fx + side * eyeSpacing;
        ctx.beginPath();
        ctx.arc(ex2, eyeY, r * 0.14, Math.PI, 0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }
    } else {
      // Normal dot eyes
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(fx + side * eyeSpacing, eyeY, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouth
    const mouthY = fy + r * 0.28;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (phase === 'lost') {
      ctx.arc(fx, mouthY + r * 0.22, r * 0.32, Math.PI + 0.4, -0.4);
    } else if (phase === 'won') {
      ctx.arc(fx, mouthY - r * 0.08, r * 0.36, 0.3, Math.PI - 0.3);
    } else {
      ctx.arc(fx, mouthY, r * 0.28, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Cheeks for won state - small pink solid circles
    if (phase === 'won') {
      ctx.fillStyle = '#ff9999';
      ctx.beginPath();
      ctx.arc(fx - r * 0.52, fy + r * 0.1, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + r * 0.52, fy + r * 0.1, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Face top highlight (solid white arc at top of circle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx, fy, r - 2, Math.PI + 0.5, Math.PI * 2 - 0.5);
    ctx.stroke();
  }

  /** Draw the game-over overlay (win or loss). Solid fills, no gradients, no shadowBlur. */
  drawGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    won: boolean,
    score: number,
    time: number
  ): void {
    // Dark semi-transparent overlay - solid, no blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.fillRect(0, 0, w, h);

    // Result card - raised panel in center
    const cardW = Math.min(w - 64, 280);
    const cardH = 130;
    const cardX = (w - cardW) / 2;
    const cardY = h / 2 - cardH / 2;

    // Card drop shadow
    ctx.fillStyle = '#000000';
    ctx.fillRect(cardX + 4, cardY + 4, cardW, cardH);

    // Card body
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Card raised bevel
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(cardX, cardY, cardW, 3);
    ctx.fillRect(cardX, cardY, 3, cardH);
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(cardX, cardY + cardH - 3, cardW, 3);
    ctx.fillRect(cardX + cardW - 3, cardY, 3, cardH);
    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(cardX + 3, cardY + 3, cardW - 6, 1);
    ctx.fillRect(cardX + 3, cardY + 3, 1, cardH - 6);
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(cardX + 3, cardY + cardH - 4, cardW - 6, 1);
    ctx.fillRect(cardX + cardW - 4, cardY + 3, 1, cardH - 6);

    // Title
    ctx.font = "900 24px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = won ? '#1565C0' : '#C62828';
    ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', w / 2, cardY + 42);

    // Divider
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(cardX + 16, cardY + 64, cardW - 32, 1);
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(cardX + 16, cardY + 65, cardW - 32, 1);

    // Score (wins only)
    if (won) {
      ctx.font = "600 14px 'Orbitron', sans-serif";
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(`Score: ${score}`, w / 2, cardY + 85);
    }

    // Pulsing restart prompt
    const promptAlpha = 0.55 + Math.sin(time * 4) * 0.35;
    ctx.font = "400 10px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(60, 60, 60, ${promptAlpha})`;
    ctx.fillText('Click or press R to restart', w / 2, cardY + cardH - 18);
  }

  /**
   * Convert mouse coordinates to a grid cell position.
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
   */
  getDifficultyAtPoint(
    mouseX: number,
    mouseY: number,
    w: number,
    h: number
  ): Difficulty | null {
    const panelW = Math.min(w - 48, 320);
    const panelH = 280;
    const panelX = (w - panelW) / 2;
    const panelY = h * 0.12;

    const titleY = panelY + 88;
    const buttonW = panelW - 48;
    const buttonH = 40;
    const buttonGap = 10;
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert'];
    const buttonsStartY = titleY + 56;
    const bx = panelX + 24;

    for (let i = 0; i < difficulties.length; i++) {
      const by = buttonsStartY + i * (buttonH + buttonGap);
      if (mouseX >= bx && mouseX <= bx + buttonW && mouseY >= by && mouseY <= by + buttonH) {
        return difficulties[i];
      }
    }

    return null;
  }
}
