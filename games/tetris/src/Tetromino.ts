import type { TetrominoType, RotationState, BlockPosition } from './types';
import { TETROMINO_DATA, SRS_KICKS_JLSTZ, SRS_KICKS_I } from './constants';

/** Represents an active tetromino piece on the board. */
export class Tetromino {
  type: TetrominoType;
  rotation: RotationState;
  x: number;
  y: number;

  constructor(type: TetrominoType, x: number, y: number) {
    this.type = type;
    this.rotation = 0;
    this.x = x;
    this.y = y;
  }

  /** Returns the absolute board positions of all 4 blocks. */
  getBlocks(): BlockPosition[] {
    const data = TETROMINO_DATA[this.type];
    const offsets = data.blocks[this.rotation];
    return offsets.map(off => ({
      x: this.x + off.x,
      y: this.y + off.y,
    }));
  }

  /** Returns the SRS kick offsets for a rotation transition. */
  getKicks(fromRotation: RotationState, toRotation: RotationState): BlockPosition[] {
    const key = `${fromRotation}>${toRotation}`;
    const table = this.type === 'I' ? SRS_KICKS_I : SRS_KICKS_JLSTZ;
    return table[key] || [{ x: 0, y: 0 }];
  }

  /** Returns the color hex value for this piece type. */
  getColor(): number {
    return TETROMINO_DATA[this.type].color;
  }

  /** Returns the emissive hex value for this piece type. */
  getEmissive(): number {
    return TETROMINO_DATA[this.type].emissive;
  }

  /** Creates a deep copy of this tetromino for testing placements. */
  clone(): Tetromino {
    const copy = new Tetromino(this.type, this.x, this.y);
    copy.rotation = this.rotation;
    return copy;
  }
}
