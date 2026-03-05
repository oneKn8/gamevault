/** Draw a circle with neon glow effect */
export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  glowColor: string,
  glowRadius: number = radius * 3,
): void {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw a line with neon glow effect */
export function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  glowColor: string,
  lineWidth: number = 2,
  glowBlur: number = 15,
): void {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Draw a rectangle with neon glow border */
export function drawGlowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  glowColor: string,
  lineWidth: number = 2,
  glowBlur: number = 15,
  cornerRadius: number = 0,
): void {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (cornerRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, cornerRadius);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

/** Apply a vignette effect (darken edges) */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.4,
): void {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.3,
    width / 2, height / 2, width * 0.7,
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
