import { Vec2 } from '../types';

/**
 * Screen-level visual effects: camera shake and full-screen colour flash.
 *
 * These effects operate on the canvas transform and overlay layers,
 * wrapping the main game draw calls:
 *
 * ```
 * effects.applyPre(ctx);   // push shake transform
 *   // ... draw game world ...
 * ctx.restore();            // pop shake transform
 * effects.applyPost(ctx, w, h); // draw flash overlay
 * ```
 *
 * Call {@link update} once per frame (before rendering) to tick decay.
 */
export class ScreenEffects {
  /** Current shake strength in pixels. Decays exponentially each frame. */
  private shakeIntensity = 0;

  /** Total duration the shake was requested for (informational). */
  private shakeDuration = 0;

  /** Accumulated shake timer (seconds). Drives the oscillation functions. */
  private shakeTimer = 0;

  /** Colour string for the flash overlay (e.g. '#ffffff'). */
  private flashColor = '';

  /** Current alpha of the flash overlay. Decays multiplicatively. */
  private flashAlpha = 0;

  // ---------------------------------------------------------------------------
  // Triggers
  // ---------------------------------------------------------------------------

  /**
   * Begin a screen shake effect.
   *
   * @param intensity - Maximum pixel offset per axis.
   * @param duration  - Not strictly enforced; the shake decays
   *   exponentially so it self-terminates. This value is stored for
   *   reference but the decay drives the actual wind-down.
   */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  /**
   * Trigger a full-screen colour flash.
   *
   * @param color - CSS colour string.
   * @param alpha - Starting opacity (0..1).
   */
  flash(color: string, alpha: number): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  // ---------------------------------------------------------------------------
  // Per-frame update
  // ---------------------------------------------------------------------------

  /**
   * Advance all effect timers / decays by `dt` seconds.
   * Call exactly once per frame, before rendering.
   */
  update(dt: number): void {
    // Shake decay.
    if (this.shakeIntensity > 0.1) {
      this.shakeTimer += dt;
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeIntensity = 0;
    }

    // Flash decay.
    if (this.flashAlpha > 0.005) {
      this.flashAlpha *= 0.85;
    } else {
      this.flashAlpha = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Render hooks
  // ---------------------------------------------------------------------------

  /**
   * Apply the shake transform before drawing game content.
   *
   * This pushes a `ctx.save()` and translates by the current shake
   * offset. The caller MUST call `ctx.restore()` after drawing to
   * undo the transform.
   */
  applyPre(ctx: CanvasRenderingContext2D): void {
    const offset = this.getShakeOffset();
    ctx.translate(offset.x, offset.y);
  }

  /**
   * Draw the flash overlay after all game content has been rendered.
   * This is drawn without the shake transform (covers the full viewport).
   *
   * @param width  - Canvas width in pixels.
   * @param height - Canvas height in pixels.
   */
  applyPost(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (this.flashAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.flashAlpha;
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * Compute the current per-frame shake pixel offset.
   *
   * Uses two incommensurate sine/cosine frequencies so the shake
   * pattern does not loop visibly.
   */
  getShakeOffset(): Vec2 {
    if (this.shakeIntensity <= 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.sin(this.shakeTimer * 37) * this.shakeIntensity,
      y: Math.cos(this.shakeTimer * 53) * this.shakeIntensity,
    };
  }
}
