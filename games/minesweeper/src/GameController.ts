import type { Difficulty, GamePhase, DifficultyConfig } from './types';
import { Board } from './Board';
import { Timer } from './Timer';
import { DIFFICULTIES } from './constants';

export class GameController {
  board: Board | null = null;
  timer: Timer;
  phase: GamePhase = 'menu';
  difficulty: Difficulty | null = null;
  score = 0;

  constructor() {
    this.timer = new Timer();
  }

  /** Select a difficulty and create the board. */
  selectDifficulty(diff: Difficulty): void {
    this.difficulty = diff;
    this.board = new Board(DIFFICULTIES[diff]);
    this.timer.reset();
    this.phase = 'playing';
    this.score = 0;
  }

  /** Get the current difficulty config, or null if not set. */
  getConfig(): DifficultyConfig | null {
    if (!this.difficulty) return null;
    return DIFFICULTIES[this.difficulty];
  }

  /**
   * Handle a left-click reveal on a cell.
   * Returns the list of newly revealed cells for animation, or null on no-op.
   * Returns 'mine' if a mine was hit.
   */
  handleClick(row: number, col: number): { row: number; col: number }[] | 'mine' | null {
    if (!this.board || this.phase !== 'playing') return null;

    const cell = this.board.getCell(row, col);
    if (!cell || cell.state !== 'hidden') return null;

    // Place mines on first click
    if (!this.board.minesPlaced) {
      this.board.placeMines(row, col);
      this.timer.start();
    }

    // Hit a mine
    if (cell.mine) {
      cell.state = 'revealed';
      this.board.revealAllMines();
      this.timer.stop();
      this.phase = 'lost';
      return 'mine';
    }

    const revealed = this.board.reveal(row, col);

    // Check win
    if (this.board.checkWin()) {
      this.timer.stop();
      this.phase = 'won';
      this.score = this.calculateScore();
    }

    return revealed;
  }

  /** Handle a right-click to toggle flag. */
  handleRightClick(row: number, col: number): void {
    if (!this.board || this.phase !== 'playing') return;
    this.board.toggleFlag(row, col);
  }

  /** Calculate score based on time and difficulty. */
  calculateScore(): number {
    const seconds = Math.max(1, this.timer.getElapsed());
    const multipliers: Record<Difficulty, number> = {
      beginner: 1,
      intermediate: 2,
      expert: 5,
    };
    const diffMultiplier = this.difficulty ? multipliers[this.difficulty] : 1;
    return Math.max(10, Math.round((1000 * diffMultiplier) / seconds));
  }

  /** Reset the game back to the menu. */
  reset(): void {
    this.board = null;
    this.timer.reset();
    this.phase = 'menu';
    this.difficulty = null;
    this.score = 0;
  }
}
