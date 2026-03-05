/** Input action types the game responds to. */
export type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause'
  | 'start';

const DAS_INITIAL = 170; // ms before auto-repeat starts
const DAS_REPEAT = 50;   // ms between repeats

interface DASState {
  active: boolean;
  timer: number;
  repeating: boolean;
}

/** Handles keyboard input with DAS (Delayed Auto Shift) for movement keys. */
export class InputManager {
  onAction: ((action: InputAction) => void) | null = null;

  private pressed = new Set<string>();
  private dasLeft: DASState = { active: false, timer: 0, repeating: false };
  private dasRight: DASState = { active: false, timer: 0, repeating: false };
  private dasSoftDrop: DASState = { active: false, timer: 0, repeating: false };

  constructor() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  /** Update DAS timers. Call every frame with dt in ms. */
  update(dt: number): void {
    this.updateDAS(this.dasLeft, 'moveLeft', dt);
    this.updateDAS(this.dasRight, 'moveRight', dt);
    this.updateDAS(this.dasSoftDrop, 'softDrop', dt);
  }

  /** Clean up event listeners. */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore browser shortcuts
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'F5' || e.key === 'F12') return;

    const key = e.key.toLowerCase();

    // Prevent default for game keys
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's'].includes(key)) {
      e.preventDefault();
    }

    if (this.pressed.has(key)) return; // Ignore key repeat
    this.pressed.add(key);

    switch (key) {
      case 'arrowleft':
      case 'a':
        this.emit('moveLeft');
        this.dasLeft = { active: true, timer: 0, repeating: false };
        break;
      case 'arrowright':
      case 'd':
        this.emit('moveRight');
        this.dasRight = { active: true, timer: 0, repeating: false };
        break;
      case 'arrowdown':
      case 's':
        this.emit('softDrop');
        this.dasSoftDrop = { active: true, timer: 0, repeating: false };
        break;
      case 'arrowup':
      case 'w':
        this.emit('rotateCW');
        break;
      case 'z':
        this.emit('rotateCCW');
        break;
      case ' ':
        this.emit('hardDrop');
        break;
      case 'c':
        this.emit('hold');
        break;
      case 'p':
      case 'escape':
        this.emit('pause');
        break;
      case 'enter':
        this.emit('start');
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.pressed.delete(key);

    switch (key) {
      case 'arrowleft':
      case 'a':
        this.dasLeft.active = false;
        break;
      case 'arrowright':
      case 'd':
        this.dasRight.active = false;
        break;
      case 'arrowdown':
      case 's':
        this.dasSoftDrop.active = false;
        break;
    }
  };

  private updateDAS(state: DASState, action: InputAction, dt: number): void {
    if (!state.active) return;

    state.timer += dt;
    const threshold = state.repeating ? DAS_REPEAT : DAS_INITIAL;

    if (state.timer >= threshold) {
      state.timer -= threshold;
      state.repeating = true;
      this.emit(action);
    }
  }

  private emit(action: InputAction): void {
    if (this.onAction) {
      this.onAction(action);
    }
  }
}
