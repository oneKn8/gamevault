import type { TileAnimation } from './types';

export class TileAnimator {
  private animations: TileAnimation[] = [];

  /**
   * Add cascading reveal animations with stagger delay.
   * Cells further from the origin get a longer delay for a ripple effect.
   */
  addReveal(cells: { row: number; col: number }[], stagger: number): void {
    if (cells.length === 0) return;

    // Use the first cell as the origin for distance calculation
    const originRow = cells[0].row;
    const originCol = cells[0].col;

    for (const cell of cells) {
      const dist = Math.abs(cell.row - originRow) + Math.abs(cell.col - originCol);
      this.animations.push({
        row: cell.row,
        col: cell.col,
        progress: 0,
        duration: 0.3,
        delay: dist * stagger,
      });
    }
  }

  /** Progress all animations by dt seconds. */
  update(dt: number): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      if (anim.delay > 0) {
        anim.delay -= dt;
        continue;
      }
      anim.progress += dt / anim.duration;
      if (anim.progress >= 1) {
        this.animations.splice(i, 1);
      }
    }
  }

  /**
   * Returns the scaleY value for a tile flip animation, or null if no animation
   * is running for this cell.
   *
   * The flip effect: scaleY goes from 1 -> 0 (first half) then 0 -> 1 (second half).
   * The "front" (revealed content) should be drawn when progress >= 0.5.
   */
  getScale(row: number, col: number): { scaleY: number; showRevealed: boolean } | null {
    const anim = this.animations.find(a => a.row === row && a.col === col && a.delay <= 0);
    if (!anim) return null;

    const p = Math.min(anim.progress, 1);
    if (p < 0.5) {
      // First half: shrink hidden tile
      const t = p / 0.5;
      return { scaleY: 1 - t, showRevealed: false };
    } else {
      // Second half: grow revealed tile
      const t = (p - 0.5) / 0.5;
      return { scaleY: t, showRevealed: true };
    }
  }

  /** Returns true if any animations are still active. */
  isAnimating(): boolean {
    return this.animations.length > 0;
  }
}
