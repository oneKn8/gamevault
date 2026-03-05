/** Draw neon text with glow effect (double-draw for bloom) */
export function drawNeonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  glowColor: string,
  fontSize: number = 24,
  font: string = 'Orbitron',
  align: CanvasTextAlign = 'center',
): void {
  ctx.save();
  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // Glow pass
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = fontSize * 0.6;
  ctx.fillStyle = glowColor;
  ctx.fillText(text, x, y);

  // Sharp pass on top
  ctx.shadowBlur = fontSize * 0.3;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.restore();
}

/** Draw outlined neon text */
export function drawNeonTextOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  glowColor: string,
  fontSize: number = 24,
  font: string = 'Orbitron',
  align: CanvasTextAlign = 'center',
  lineWidth: number = 2,
): void {
  ctx.save();
  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = fontSize * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeText(text, x, y);

  ctx.restore();
}
