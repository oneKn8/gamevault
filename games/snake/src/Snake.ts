import { Direction, type GridPosition } from './types';

/**
 * Manages the snake's body segments, movement, growth, and collision detection.
 * The head is always at index 0 of the segments array.
 */
export class Snake {
  segments: GridPosition[];
  direction: Direction;
  private shouldGrow: boolean;

  constructor(startX: number, startY: number) {
    this.segments = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = Direction.RIGHT;
    this.shouldGrow = false;
  }

  /** Returns the head segment (index 0). */
  getHead(): GridPosition {
    return this.segments[0];
  }

  /** Flag the snake to add a segment on the next move call. */
  grow(): void {
    this.shouldGrow = true;
  }

  /**
   * Move the snake one cell in the current direction.
   * If growing, the tail is preserved (effectively extending by one).
   */
  move(): void {
    const head = this.getHead();
    let newHead: GridPosition;

    switch (this.direction) {
      case Direction.UP:
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case Direction.DOWN:
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case Direction.LEFT:
        newHead = { x: head.x - 1, y: head.y };
        break;
      case Direction.RIGHT:
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    this.segments.unshift(newHead);

    if (this.shouldGrow) {
      this.shouldGrow = false;
    } else {
      this.segments.pop();
    }
  }

  /** Returns true if the head is outside the grid bounds. */
  checkWallCollision(gridW: number, gridH: number): boolean {
    const head = this.getHead();
    return head.x < 0 || head.x >= gridW || head.y < 0 || head.y >= gridH;
  }

  /** Returns true if the head overlaps any body segment. */
  checkSelfCollision(): boolean {
    const head = this.getHead();
    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].x === head.x && this.segments[i].y === head.y) {
        return true;
      }
    }
    return false;
  }
}
