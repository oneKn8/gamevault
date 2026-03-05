import { EventBus } from '../engine/EventBus';
import { InputManager } from '../engine/InputManager';
import { Layout } from '../world/Layout';
import { LAYOUTS, LEVEL_ORDER } from '../world/LayoutData';
import { Pacman } from '../entities/Pacman';
import { Ghost } from '../entities/Ghost';
import { CollisionSystem } from './CollisionSystem';
import { ScoreSystem } from './ScoreSystem';
import { AudioEngine } from '../audio/AudioEngine';
import { SoundDesign } from '../audio/SoundDesign';
import { MazeRenderer } from '../rendering/MazeRenderer';
import {
  GamePhase,
  GameEvent,
  GhostMode,
  Direction,
  Tile,
  OPPOSITE_DIRECTION,
} from '../types';
import {
  SCARED_DURATION,
  DEATH_ANIM_DURATION,
  READY_DURATION,
  LEVEL_CLEAR_DURATION,
  INVULNERABLE_DURATION,
  INITIAL_LIVES,
  GHOST_RELEASE_DOTS,
  SCATTER_CHASE_CYCLE,
} from '../constants';

// ---------------------------------------------------------------------------
// Structural interface for the Renderer dependency.
//
// GameState does not import the concrete Renderer class to avoid a circular
// dependency.  Any object satisfying this shape can be injected.
// ---------------------------------------------------------------------------

/** Minimal surface of the rendering layer that GameState interacts with. */
export interface Renderer {
  readonly mazeRenderer: MazeRenderer;
}

// ---------------------------------------------------------------------------
// Ghost identity constants
// ---------------------------------------------------------------------------

/** Display names for the four ghosts, in spawn order. */
const GHOST_NAMES: readonly string[] = ['blinky', 'pinky', 'inky', 'clyde'];

// ---------------------------------------------------------------------------
// GameState
// ---------------------------------------------------------------------------

/**
 * Central game-state manager that orchestrates every subsystem.
 *
 * Responsibilities:
 * - Phase transitions (MENU -> READY -> PLAYING -> DYING / LEVEL_CLEAR -> ...)
 * - Entity lifecycle (Pacman, Ghosts)
 * - Scatter / Chase mode cycling
 * - Collision delegation
 * - Score tracking
 * - Sound playback triggers
 * - Event emission for VFX / UI layers
 */
export class GameState {
  /** Current phase of the game state machine. */
  phase: GamePhase;

  /** The parsed maze for the current level. */
  layout!: Layout;

  /** The player-controlled entity. */
  pacman!: Pacman;

  /** All four ghosts. */
  ghosts: Ghost[] = [];

  /** Remaining lives (decremented on death, not including current life). */
  lives: number;

  /** Current level number (1-indexed). */
  level: number;

  /** Cumulative food dots eaten this level. */
  dotsEaten: number;

  /** Food dots remaining this level. */
  dotsRemaining: number;

  // -- Subsystems --
  readonly events: EventBus;
  readonly input: InputManager;
  readonly collision: CollisionSystem;
  readonly score: ScoreSystem;
  readonly audio: AudioEngine;
  readonly sounds: SoundDesign;
  readonly renderer: Renderer;

  // -- Phase timers --
  private phaseTimer = 0;
  private deathTimer = 0;

  /** 0-to-1 progress of the death animation, consumed by the renderer. */
  deathProgress = 0;

  // -- Ghost mode cycling --
  private ghostModeIndex = 0;
  private ghostModeTimer = 0;
  private inScatter = true;

  /** Elapsed game time in seconds (used for animation clocks). */
  private elapsedTime = 0;

  constructor(events: EventBus, input: InputManager, renderer: Renderer) {
    this.events = events;
    this.input = input;
    this.renderer = renderer;

    this.collision = new CollisionSystem();
    this.score = new ScoreSystem();
    this.audio = new AudioEngine();
    this.sounds = new SoundDesign(this.audio);

    this.phase = GamePhase.MENU;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.dotsEaten = 0;
    this.dotsRemaining = 0;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Start (or restart) the game from level 1.
   *
   * Resets score, lives, and loads the first level.
   */
  startGame(): void {
    this.audio.init();
    this.score.reset();
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.elapsedTime = 0;
    this.loadLevel(this.level);
    this.enterReady();
  }

  /**
   * Load (or reload) a level.
   *
   * Creates the Layout, Pacman, and all four Ghosts. Handles layouts that
   * have fewer than 4 ghost-start markers or none at all.
   *
   * @param levelNum 1-indexed level number. Wraps around LEVEL_ORDER.
   */
  loadLevel(levelNum: number): void {
    // Pick the layout, wrapping around if the player exceeds available levels.
    const layoutIndex = (levelNum - 1) % LEVEL_ORDER.length;
    const layoutName = LEVEL_ORDER[layoutIndex];
    const layoutText = LAYOUTS[layoutName];
    this.layout = new Layout(layoutText);

    // -- Pacman --
    this.pacman = new Pacman(this.layout.pacmanStart);

    // -- Ghost start tiles --
    let ghostStartTiles: Tile[];

    if (this.layout.ghostStarts.length === 0) {
      // No ghost markers: place ghosts at the center of the maze.
      const centerCol = Math.floor(this.layout.width / 2);
      const centerRow = Math.floor(this.layout.height / 2);
      ghostStartTiles = [
        { col: centerCol, row: centerRow },
        { col: centerCol - 1, row: centerRow },
        { col: centerCol + 1, row: centerRow },
        { col: centerCol, row: centerRow - 1 },
      ];
    } else {
      ghostStartTiles = [...this.layout.ghostStarts];
      // Pad to 4 by duplicating the last available start position.
      while (ghostStartTiles.length < 4) {
        ghostStartTiles.push({
          ...ghostStartTiles[ghostStartTiles.length - 1],
        });
      }
    }

    // -- Scatter targets (corners) --
    const w = this.layout.width;
    const h = this.layout.height;
    const scatterTargets: Tile[] = [
      { col: w - 3, row: 0 },       // blinky: top-right
      { col: 2, row: 0 },           // pinky: top-left
      { col: w - 1, row: h - 1 },   // inky: bottom-right
      { col: 0, row: h - 1 },       // clyde: bottom-left
    ];

    // -- Create ghosts --
    this.ghosts = [];
    for (let i = 0; i < 4; i++) {
      const ghost = new Ghost(
        GHOST_NAMES[i],
        ghostStartTiles[i],
        scatterTargets[i],
      );
      this.ghosts.push(ghost);
    }

    // -- Dot counters --
    this.dotsEaten = 0;
    this.dotsRemaining = this.layout.totalDots;

    // -- Ghost mode cycling --
    this.ghostModeIndex = 0;
    this.ghostModeTimer = 0;
    this.inScatter = true;

    // Force the maze renderer to rebuild its wall cache for the new layout.
    this.renderer.mazeRenderer.invalidate();
  }

  // ---------------------------------------------------------------------------
  // Main update
  // ---------------------------------------------------------------------------

  /**
   * Advance the game by one fixed timestep.
   *
   * Delegates to the appropriate phase-specific updater.
   */
  update(dt: number): void {
    this.elapsedTime += dt;

    switch (this.phase) {
      case GamePhase.READY:
        this.updateReady(dt);
        break;
      case GamePhase.PLAYING:
        this.updatePlaying(dt);
        break;
      case GamePhase.DYING:
        this.updateDying(dt);
        break;
      case GamePhase.LEVEL_CLEAR:
        this.updateLevelClear(dt);
        break;
      case GamePhase.GAME_OVER:
        this.updateGameOver(dt);
        break;
      // MENU: no-op, waiting for startGame()
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: READY
  // ---------------------------------------------------------------------------

  /** Transition into the READY phase. */
  private enterReady(): void {
    this.phase = GamePhase.READY;
    this.phaseTimer = READY_DURATION;
    this.input.clearQueue();
  }

  /**
   * Count down the "READY!" banner timer, then switch to PLAYING.
   */
  private updateReady(dt: number): void {
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.phase = GamePhase.PLAYING;

      // Release the first ghost(s) whose dot threshold is 0.
      this.checkGhostRelease();
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: PLAYING
  // ---------------------------------------------------------------------------

  /**
   * Core gameplay tick.
   *
   * Order of operations:
   * 1. Process input queue and buffer direction for Pacman.
   * 2. Update ghost scatter/chase mode timer.
   * 3. Move Pacman.
   * 4. Move Ghosts.
   * 5. Check food and capsule eating.
   * 6. Check Pacman-Ghost collisions.
   * 7. Check ghost-house releases.
   * 8. Check win condition.
   */
  private updatePlaying(dt: number): void {
    // 1 -- Input
    const inputDir = this.input.peekDirection();
    if (inputDir !== Direction.NONE) {
      this.pacman.setNextDirection(inputDir);
      // Only consume after Pacman actually turns, or if it is a valid buffer.
      // For responsiveness we consume immediately -- Pacman's internal
      // tryTurn logic handles the "can't turn yet" case via nextDir.
      this.input.consumeDirection();
    }

    // 2 -- Ghost mode cycling (scatter <-> chase)
    this.updateGhostModes(dt);

    // 3 -- Move Pacman
    this.pacman.update(dt, this.layout);

    // 4 -- Move Ghosts
    const pacTile = this.pacman.getTile();
    const pacDir = this.pacman.dir;
    for (const ghost of this.ghosts) {
      ghost.update(dt, this.layout, pacTile, pacDir);
    }

    // 5 -- Food & capsule eating
    this.handleFoodEat();
    this.handleCapsuleEat();

    // 6 -- Ghost collisions
    this.handleGhostCollisions();

    // 7 -- Ghost house releases
    this.checkGhostRelease();

    // 8 -- Win condition
    if (this.dotsRemaining <= 0) {
      this.onLevelClear();
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: DYING
  // ---------------------------------------------------------------------------

  /**
   * Animate Pacman's death, then either respawn or end the game.
   */
  private updateDying(dt: number): void {
    this.deathTimer += dt;
    this.deathProgress = Math.min(this.deathTimer / DEATH_ANIM_DURATION, 1);

    if (this.deathTimer >= DEATH_ANIM_DURATION) {
      if (this.lives > 0) {
        // Respawn: reset positions, keep dots and score.
        this.pacman.reset();
        this.pacman.invulnerable = true;
        this.pacman.invulnerableTimer = INVULNERABLE_DURATION;

        for (const ghost of this.ghosts) {
          ghost.reset();
        }

        // Reset ghost mode cycling.
        this.ghostModeIndex = 0;
        this.ghostModeTimer = 0;
        this.inScatter = true;

        this.enterReady();
      } else {
        this.phase = GamePhase.GAME_OVER;
        this.phaseTimer = 0;
        this.events.emit(GameEvent.GAME_OVER);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: LEVEL_CLEAR
  // ---------------------------------------------------------------------------

  /**
   * Brief pause after clearing all dots, then load the next level.
   */
  private updateLevelClear(dt: number): void {
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.level++;
      this.loadLevel(this.level);
      this.enterReady();
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: GAME_OVER
  // ---------------------------------------------------------------------------

  /**
   * Wait for any input to restart the game.
   */
  private updateGameOver(_dt: number): void {
    if (this.input.hasInput()) {
      this.input.clearQueue();
      this.startGame();
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Called when Pacman dies.
   * Decrements lives, switches to DYING phase, and plays the death sound.
   */
  private onPacmanDied(): void {
    this.pacman.alive = false;
    this.lives--;
    this.phase = GamePhase.DYING;
    this.deathTimer = 0;
    this.deathProgress = 0;
    this.sounds.death();
    this.events.emit(GameEvent.PACMAN_DIED);
  }

  /**
   * Called when Pacman eats a power capsule.
   * Frightens all eligible ghosts and resets the combo counter.
   */
  private onCapsuleEaten(): void {
    this.score.addCapsuleScore();
    this.score.resetCombo();
    this.sounds.capsuleEat();

    for (const ghost of this.ghosts) {
      ghost.enterFrightened(SCARED_DURATION);
    }

    this.events.emit(GameEvent.CAPSULE_EATEN);
  }

  /**
   * Called when Pacman eats a frightened ghost.
   * Awards combo score, plays sound, and sends ghost to EATEN mode.
   */
  private onGhostEaten(ghost: Ghost): void {
    const points = this.score.addGhostScore();

    // Determine ghost house tile for eaten ghost to return to.
    const ghostHouseTile = this.getGhostHouseTile();
    ghost.enterEaten(ghostHouseTile);

    this.sounds.ghostEat(this.score.comboCount);
    this.events.emit(GameEvent.GHOST_EATEN, {
      ghost,
      points,
      combo: this.score.comboCount,
    });
  }

  /**
   * Called when all dots are eaten.
   */
  private onLevelClear(): void {
    this.phase = GamePhase.LEVEL_CLEAR;
    this.phaseTimer = LEVEL_CLEAR_DURATION;
    this.score.addLevelClearBonus();
    this.sounds.levelComplete();
    this.events.emit(GameEvent.LEVEL_CLEAR);
  }

  // ---------------------------------------------------------------------------
  // Collision helpers
  // ---------------------------------------------------------------------------

  /** Check and handle food eating. */
  private handleFoodEat(): void {
    const foodTile = this.collision.checkFoodEat(this.pacman, this.layout);
    if (foodTile) {
      this.dotsEaten++;
      this.dotsRemaining--;
      this.score.addDotScore();
      this.sounds.dotEat();
      this.events.emit(GameEvent.DOT_EATEN, { tile: foodTile });
    }
  }

  /** Check and handle capsule eating. */
  private handleCapsuleEat(): void {
    const capsuleTile = this.collision.checkCapsuleEat(
      this.pacman,
      this.layout,
    );
    if (capsuleTile) {
      this.onCapsuleEaten();
    }
  }

  /** Check and handle Pacman-Ghost collisions. */
  private handleGhostCollisions(): void {
    const result = this.collision.checkGhostCollision(
      this.pacman,
      this.ghosts,
    );

    // Process eaten ghosts first (so score gets awarded before potential death).
    for (const eatenGhost of result.eaten) {
      // We need the actual Ghost reference to call enterEaten().
      // The collision system returns the same object references from the
      // ghosts array, so a direct identity check is safe.
      const ghost = this.ghosts.find((g) => g === eatenGhost);
      if (ghost) {
        this.onGhostEaten(ghost);
      }
    }

    if (result.killed) {
      this.onPacmanDied();
    }
  }

  // ---------------------------------------------------------------------------
  // Ghost house
  // ---------------------------------------------------------------------------

  /**
   * Release ghosts from the house based on how many dots Pacman has eaten.
   *
   * Each ghost has a dot-count threshold defined in {@link GHOST_RELEASE_DOTS}.
   * When the cumulative dots eaten reaches or exceeds a ghost's threshold,
   * that ghost is released.
   */
  private checkGhostRelease(): void {
    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      if (ghost.released) continue;
      if (ghost.mode !== GhostMode.HOUSE) continue;

      const threshold = i < GHOST_RELEASE_DOTS.length
        ? GHOST_RELEASE_DOTS[i]
        : GHOST_RELEASE_DOTS[GHOST_RELEASE_DOTS.length - 1];

      if (this.dotsEaten >= threshold) {
        ghost.release();

        // Assign the current scatter/chase mode to the newly released ghost.
        if (this.inScatter) {
          ghost.mode = GhostMode.SCATTER;
        } else {
          ghost.mode = GhostMode.CHASE;
        }
      }
    }
  }

  /**
   * Compute the ghost-house tile that eaten ghosts navigate toward.
   *
   * Uses the average position of all ghost start tiles, or falls back to
   * the first ghost start.
   */
  private getGhostHouseTile(): Tile {
    const starts = this.layout.ghostStarts;
    if (starts.length === 0) {
      return {
        col: Math.floor(this.layout.width / 2),
        row: Math.floor(this.layout.height / 2),
      };
    }

    if (starts.length === 1) {
      return { col: starts[0].col, row: starts[0].row };
    }

    // Average of all ghost start positions, rounded.
    let sumCol = 0;
    let sumRow = 0;
    for (const s of starts) {
      sumCol += s.col;
      sumRow += s.row;
    }
    return {
      col: Math.round(sumCol / starts.length),
      row: Math.round(sumRow / starts.length),
    };
  }

  // ---------------------------------------------------------------------------
  // Ghost mode cycling
  // ---------------------------------------------------------------------------

  /**
   * Cycle through the SCATTER_CHASE_CYCLE table.
   *
   * When the mode flips (scatter -> chase or vice versa), all ghosts
   * currently in SCATTER or CHASE reverse their direction. Ghosts in
   * FRIGHTENED or EATEN modes are unaffected.
   */
  private updateGhostModes(dt: number): void {
    // If we have exhausted the cycle table, the last entry's chase is
    // Infinity, so no further mode changes occur.
    if (this.ghostModeIndex >= SCATTER_CHASE_CYCLE.length) return;

    this.ghostModeTimer += dt;
    const cycle = SCATTER_CHASE_CYCLE[this.ghostModeIndex];
    const currentDuration = this.inScatter ? cycle.scatter : cycle.chase;

    if (this.ghostModeTimer >= currentDuration) {
      this.ghostModeTimer -= currentDuration;

      if (this.inScatter) {
        // Scatter -> Chase
        this.inScatter = false;
      } else {
        // Chase -> Scatter (advance to next cycle entry)
        this.inScatter = true;
        this.ghostModeIndex++;
        if (this.ghostModeIndex >= SCATTER_CHASE_CYCLE.length) return;
      }

      // Flip all active ghosts' modes and reverse their direction.
      const newMode = this.inScatter ? GhostMode.SCATTER : GhostMode.CHASE;
      for (const ghost of this.ghosts) {
        if (
          ghost.mode === GhostMode.SCATTER ||
          ghost.mode === GhostMode.CHASE
        ) {
          ghost.mode = newMode;
          ghost.dir = OPPOSITE_DIRECTION[ghost.dir];
        }
        // Update prevMode so ghosts exiting FRIGHTENED return to the
        // correct mode.
        if (
          ghost.mode === GhostMode.FRIGHTENED
        ) {
          ghost.prevMode = newMode;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Render state
  // ---------------------------------------------------------------------------

  /**
   * Build a snapshot of the current game state for the rendering layer.
   *
   * The renderer calls this once per frame to obtain everything it needs
   * without reaching into internal state.
   */
  getRenderState(): RenderState {
    return {
      phase: this.phase,
      layout: this.layout,
      pacman: this.pacman,
      ghosts: this.ghosts,
      score: this.score.score,
      highScore: this.score.highScore,
      lives: this.lives,
      level: this.level,
      deathProgress: this.deathProgress,
      time: this.elapsedTime,
      comboCount: this.score.comboCount,
    };
  }
}

// ---------------------------------------------------------------------------
// Render state snapshot type
// ---------------------------------------------------------------------------

/**
 * Immutable snapshot of the game state consumed by the rendering layer.
 *
 * All fields are readonly so the renderer cannot accidentally mutate game
 * state.
 */
export interface RenderState {
  readonly phase: GamePhase;
  readonly layout: Layout;
  readonly pacman: Pacman;
  readonly ghosts: readonly Ghost[];
  readonly score: number;
  readonly highScore: number;
  readonly lives: number;
  readonly level: number;
  readonly deathProgress: number;
  readonly time: number;
  readonly comboCount: number;
}
