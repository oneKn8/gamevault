import { SnakeRenderer } from './SnakeRenderer';
import { FoodRenderer } from './FoodRenderer';
import { ParticleSystem } from './ParticleSystem';
import { GameController } from './GameController';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL,
  GRID_W,
  GRID_H,
  HUD_HEIGHT,
  BG,
  GRID_LINE,
  SNAKE_HEAD,
} from './constants';

/**
 * Orchestrates all drawing: title screen, HUD, game field, and game-over overlay.
 * Delegates snake and food rendering to dedicated sub-renderers.
 */
export class Renderer {
  snakeRenderer: SnakeRenderer;
  foodRenderer: FoodRenderer;

  constructor() {
    this.snakeRenderer = new SnakeRenderer();
    this.foodRenderer = new FoodRenderer();
  }

  /** Draw the title screen. */
  drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title text.
    ctx.font = '900 48px "Orbitron", sans-serif';
    ctx.fillStyle = SNAKE_HEAD;
    ctx.shadowColor = SNAKE_HEAD;
    ctx.shadowBlur = 25;
    ctx.fillText('SNAKE', w / 2, h * 0.32);
    // Double-draw for extra glow intensity.
    ctx.shadowBlur = 40;
    ctx.fillText('SNAKE', w / 2, h * 0.32);
    ctx.shadowBlur = 0;

    // Decorative line.
    const lineGrad = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, 'rgba(0, 255, 136, 0.4)');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.42);
    ctx.lineTo(w * 0.85, h * 0.42);
    ctx.stroke();

    // Pulsing prompt.
    ctx.font = '600 14px "Orbitron", sans-serif';
    ctx.fillStyle = SNAKE_HEAD;
    ctx.shadowColor = SNAKE_HEAD;
    ctx.shadowBlur = 10;
    const alpha = 0.3 + Math.sin(time * 3) * 0.7;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillText('PRESS SPACE TO START', w / 2, h * 0.54);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Controls hint.
    ctx.font = '400 10px "Orbitron", sans-serif';
    ctx.fillStyle = '#555566';
    ctx.fillText('ARROW KEYS / WASD TO MOVE', w / 2, h * 0.72);
    ctx.fillText('EAT FOOD TO GROW -- AVOID WALLS & YOURSELF', w / 2, h * 0.72 + 18);

    ctx.restore();
  }

  /** Draw the top HUD bar with the current score. */
  drawHUD(ctx: CanvasRenderingContext2D, w: number, score: number): void {
    // HUD background.
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, HUD_HEIGHT);

    // Bottom border.
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_HEIGHT);
    ctx.lineTo(w, HUD_HEIGHT);
    ctx.stroke();

    ctx.save();
    ctx.textBaseline = 'middle';

    // Score label.
    ctx.font = '400 11px "Orbitron", sans-serif';
    ctx.fillStyle = '#556666';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 14, HUD_HEIGHT / 2 - 1);

    // Score value.
    ctx.font = '700 18px "Orbitron", sans-serif';
    ctx.fillStyle = SNAKE_HEAD;
    ctx.shadowColor = SNAKE_HEAD;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left';
    ctx.fillText(String(score), 80, HUD_HEIGHT / 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /** Draw subtle grid lines on the playing field. */
  drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= GRID_W; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, HUD_HEIGHT);
      ctx.lineTo(x * CELL, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_H; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + HUD_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH, y * CELL + HUD_HEIGHT);
      ctx.stroke();
    }
  }

  /** Draw the full game frame: background, grid, food, snake, particles, HUD. */
  drawGame(
    ctx: CanvasRenderingContext2D,
    controller: GameController,
    particles: ParticleSystem,
    _time: number
  ): void {
    // Clear.
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid(ctx);
    this.foodRenderer.draw(ctx, controller.food, CELL);
    this.snakeRenderer.draw(ctx, controller.snake, CELL);
    particles.draw(ctx);
    this.drawHUD(ctx, CANVAS_WIDTH, controller.score);
  }

  /** Draw the game-over overlay with score and restart prompt. */
  drawGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    score: number,
    time: number
  ): void {
    // Semi-transparent overlay.
    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.fillRect(0, HUD_HEIGHT, w, h - HUD_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const midY = HUD_HEIGHT + (h - HUD_HEIGHT) / 2;

    // "GAME OVER" text.
    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', w / 2, midY - 40);
    ctx.shadowBlur = 0;

    // Final score.
    ctx.font = '600 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`SCORE: ${score}`, w / 2, midY + 10);

    // Pulsing restart prompt.
    ctx.font = '600 12px "Orbitron", sans-serif';
    ctx.fillStyle = SNAKE_HEAD;
    ctx.shadowColor = SNAKE_HEAD;
    ctx.shadowBlur = 8;
    const alpha = 0.3 + Math.sin(time * 3) * 0.7;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillText('PRESS SPACE TO RESTART', w / 2, midY + 50);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
