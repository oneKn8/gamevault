import { Direction } from '../types';

export class InputManager {
  private queue: Direction[] = [];
  private maxQueue = 2;
  private touchStartX = 0;
  private touchStartY = 0;
  private keys = new Set<string>();

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('touchstart', this.onTouchStart, { passive: true });
    document.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
    const dir = this.keyToDirection(e.code);
    if (dir !== Direction.NONE) {
      e.preventDefault();
      this.enqueue(dir);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
  };

  private onTouchEnd = (e: TouchEvent): void => {
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.enqueue(dx > 0 ? Direction.RIGHT : Direction.LEFT);
    } else {
      this.enqueue(dy > 0 ? Direction.DOWN : Direction.UP);
    }
  };

  private keyToDirection(code: string): Direction {
    switch (code) {
      case 'ArrowUp': case 'KeyW': return Direction.UP;
      case 'ArrowDown': case 'KeyS': return Direction.DOWN;
      case 'ArrowLeft': case 'KeyA': return Direction.LEFT;
      case 'ArrowRight': case 'KeyD': return Direction.RIGHT;
      default: return Direction.NONE;
    }
  }

  private enqueue(dir: Direction): void {
    // Don't add duplicate of last queued direction
    if (this.queue.length > 0 && this.queue[this.queue.length - 1] === dir) return;
    if (this.queue.length >= this.maxQueue) {
      this.queue.shift();
    }
    this.queue.push(dir);
  }

  peekDirection(): Direction {
    return this.queue.length > 0 ? this.queue[0] : Direction.NONE;
  }

  consumeDirection(): Direction {
    return this.queue.shift() ?? Direction.NONE;
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  clearQueue(): void {
    this.queue = [];
  }

  hasInput(): boolean {
    return this.queue.length > 0;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('touchstart', this.onTouchStart);
    document.removeEventListener('touchend', this.onTouchEnd);
  }
}
