import {
  DOT_SCORE,
  CAPSULE_SCORE,
  GHOST_BASE_SCORE,
  LEVEL_CLEAR_BONUS,
} from '../constants';

/** localStorage key used to persist the all-time high score. */
const HIGH_SCORE_KEY = 'neonpacman_highscore';

/** Maximum ghost-combo multiplier (caps at the 4th ghost). */
const MAX_COMBO_POINTS = 1600;

/**
 * Tracks the current score, ghost-eat combo chain, and persisted high score.
 *
 * The combo counter resets when frightened mode ends or a new power capsule
 * is consumed.  Ghost points follow the classic doubling progression:
 * 200, 400, 800, 1600 (capped).
 */
export class ScoreSystem {
  /** Current game score. */
  score = 0;

  /** All-time high score, loaded from localStorage on construction. */
  highScore = 0;

  /**
   * Number of ghosts eaten during the current power-pellet window.
   * Resets to 0 when frightened mode expires or a new capsule is eaten.
   */
  comboCount = 0;

  constructor() {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.highScore = parsed;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Score additions
  // ---------------------------------------------------------------------------

  /**
   * Award points for eating a food dot.
   * @returns The number of points added.
   */
  addDotScore(): number {
    this.score += DOT_SCORE;
    this.updateHighScore();
    return DOT_SCORE;
  }

  /**
   * Award points for eating a power capsule.
   * @returns The number of points added.
   */
  addCapsuleScore(): number {
    this.score += CAPSULE_SCORE;
    this.updateHighScore();
    return CAPSULE_SCORE;
  }

  /**
   * Award points for eating a ghost.
   *
   * Uses the doubling combo progression: 200, 400, 800, 1600 (capped).
   * The combo counter is incremented before computing the points so
   * the first ghost in a chain scores 200.
   *
   * @returns The number of points added.
   */
  addGhostScore(): number {
    this.comboCount++;
    const points = Math.min(
      GHOST_BASE_SCORE * Math.pow(2, this.comboCount - 1),
      MAX_COMBO_POINTS,
    );
    this.score += points;
    this.updateHighScore();
    return points;
  }

  /**
   * Award the bonus for clearing a level.
   * @returns The number of points added.
   */
  addLevelClearBonus(): number {
    this.score += LEVEL_CLEAR_BONUS;
    this.updateHighScore();
    return LEVEL_CLEAR_BONUS;
  }

  // ---------------------------------------------------------------------------
  // Combo management
  // ---------------------------------------------------------------------------

  /**
   * Reset the ghost-eat combo counter.
   *
   * Called when the frightened timer expires or when a new capsule is
   * consumed (the spec resets combo on new capsule so the doubling
   * restarts from 200).
   */
  resetCombo(): void {
    this.comboCount = 0;
  }

  // ---------------------------------------------------------------------------
  // Game lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Reset the score and combo for a brand-new game.
   * The high score is intentionally preserved across games.
   */
  reset(): void {
    this.score = 0;
    this.comboCount = 0;
  }

  // ---------------------------------------------------------------------------
  // High score persistence
  // ---------------------------------------------------------------------------

  /**
   * Update and persist the high score if the current score exceeds it.
   */
  private updateHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      } catch {
        // localStorage may be unavailable (private browsing, quota exceeded).
        // Silently ignore -- the high score still lives in memory this session.
      }
    }
  }
}
