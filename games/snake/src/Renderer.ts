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
  FIELD_LIGHT,
  FIELD_DARK,
  FIELD_BORDER,
  HUD_BG,
  HUD_TEXT,
  HUD_LABEL,
  SNAKE_HEAD,
} from './constants';

export class Renderer {
  snakeRenderer: SnakeRenderer;
  foodRenderer: FoodRenderer;

  constructor() {
    this.snakeRenderer = new SnakeRenderer();
    this.foodRenderer = new FoodRenderer();
  }

  drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // Green field background
    ctx.fillStyle = FIELD_DARK;
    ctx.fillRect(0, 0, w, h);

    // Checkerboard pattern on background
    for (let r = 0; r < Math.ceil(h / CELL); r++) {
      for (let c = 0; c < Math.ceil(w / CELL); c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = FIELD_LIGHT;
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }
    }

    // Darkened overlay for readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title text with shadow
    ctx.fillStyle = '#1b5e20';
    ctx.font = '900 50px "Orbitron", sans-serif';
    ctx.fillText('SNAKE', w / 2 + 2, h * 0.32 + 2);
    ctx.fillStyle = '#66bb6a';
    ctx.fillText('SNAKE', w / 2, h * 0.32);

    // Decorative border line
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.42);
    ctx.lineTo(w * 0.8, h * 0.42);
    ctx.stroke();

    // Pulsing prompt
    ctx.font = '600 14px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    const alpha = 0.3 + Math.sin(time * 3) * 0.7;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillText('PRESS SPACE TO START', w / 2, h * 0.54);
    ctx.globalAlpha = 1;

    // Controls hint
    ctx.font = '400 10px "Orbitron", sans-serif';
    ctx.fillStyle = '#a5d6a7';
    ctx.fillText('ARROW KEYS / WASD TO MOVE', w / 2, h * 0.72);
    ctx.fillText('EAT FOOD TO GROW -- AVOID WALLS & YOURSELF', w / 2, h * 0.72 + 18);

    ctx.restore();
  }

  drawHUD(ctx: CanvasRenderingContext2D, w: number, score: number): void {
    // HUD background
    ctx.fillStyle = HUD_BG;
    ctx.fillRect(0, 0, w, HUD_HEIGHT);

    // Bottom border
    ctx.fillStyle = FIELD_BORDER;
    ctx.fillRect(0, HUD_HEIGHT - 2, w, 2);

    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, w, 2);

    ctx.save();
    ctx.textBaseline = 'middle';

    // Score label
    ctx.font = '400 11px "Orbitron", sans-serif';
    ctx.fillStyle = HUD_LABEL;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 14, HUD_HEIGHT / 2 - 1);

    // Score value
    ctx.font = '700 20px "Orbitron", sans-serif';
    ctx.fillStyle = HUD_TEXT;
    ctx.textAlign = 'left';
    ctx.fillText(String(score), 80, HUD_HEIGHT / 2);

    ctx.restore();
  }

  /** Draw checkerboard grid on the playing field. */
  drawGrid(ctx: CanvasRenderingContext2D): void {
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? FIELD_LIGHT : FIELD_DARK;
        ctx.fillRect(c * CELL, r * CELL + HUD_HEIGHT, CELL, CELL);
      }
    }
  }

  drawGame(
    ctx: CanvasRenderingContext2D,
    controller: GameController,
    particles: ParticleSystem,
    _time: number
  ): void {
    this.drawGrid(ctx);
    this.foodRenderer.draw(ctx, controller.food, CELL);
    this.snakeRenderer.draw(ctx, controller.snake, CELL);
    particles.draw(ctx);
    this.drawHUD(ctx, CANVAS_WIDTH, controller.score);
  }

  drawGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    score: number,
    time: number
  ): void {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, HUD_HEIGHT, w, h - HUD_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const midY = HUD_HEIGHT + (h - HUD_HEIGHT) / 2;

    // "GAME OVER" with drop shadow
    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#7f0000';
    ctx.fillText('GAME OVER', w / 2 + 2, midY - 38);
    ctx.fillStyle = '#ef5350';
    ctx.fillText('GAME OVER', w / 2, midY - 40);

    // Final score
    ctx.font = '600 16px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${score}`, w / 2, midY + 10);

    // Pulsing restart prompt
    ctx.font = '600 12px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    const alpha = 0.3 + Math.sin(time * 3) * 0.7;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillText('PRESS SPACE TO RESTART', w / 2, midY + 50);
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
