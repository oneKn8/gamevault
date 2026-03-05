import type { GameSettings, GridSize, PiecesPerPlayer, AICount, AIDifficulty, ObstacleCount, WinTarget, PlanTimer } from './types';
import {
  DEFAULT_SETTINGS, GRID_SIZE_OPTIONS, PIECES_OPTIONS,
  AI_COUNT_OPTIONS, AI_DIFFICULTY_OPTIONS, OBSTACLE_OPTIONS,
  WIN_TARGET_OPTIONS, PLAN_TIMER_OPTIONS,
} from './constants';

interface SettingDef {
  label: string;
  key: keyof GameSettings;
  options: readonly (string | number)[];
  format: (val: string | number) => string;
}

const SETTINGS_DEFS: SettingDef[] = [
  {
    label: 'Grid Size',
    key: 'gridSize',
    options: GRID_SIZE_OPTIONS,
    format: (v) => `${v}x${v}`,
  },
  {
    label: 'Pieces',
    key: 'piecesPerPlayer',
    options: PIECES_OPTIONS,
    format: (v) => `${v}`,
  },
  {
    label: 'AI Opponents',
    key: 'aiCount',
    options: AI_COUNT_OPTIONS,
    format: (v) => `${v}`,
  },
  {
    label: 'AI Difficulty',
    key: 'aiDifficulty',
    options: AI_DIFFICULTY_OPTIONS,
    format: (v) => `${String(v).charAt(0).toUpperCase()}${String(v).slice(1)}`,
  },
  {
    label: 'Obstacles',
    key: 'obstacles',
    options: OBSTACLE_OPTIONS,
    format: (v) => v === 0 ? 'None' : v === 4 ? 'Few' : v === 8 ? 'Some' : 'Many',
  },
  {
    label: 'Win Target',
    key: 'winTarget',
    options: WIN_TARGET_OPTIONS,
    format: (v) => `${v}%`,
  },
  {
    label: 'Plan Timer',
    key: 'planTimer',
    options: PLAN_TIMER_OPTIONS,
    format: (v) => v === 0 ? 'Off' : `${v}s`,
  },
];

export class SettingsScreen {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width = 0;
  private height = 0;
  private settings: GameSettings;
  private visible = false;
  private hoveredSetting: number = -1;
  private hoveredOption: number = -1;
  private startButtonHovered = false;

  private onStartCallback: ((settings: GameSettings) => void) | null = null;
  private onSettingsChangeCallback: ((settings: GameSettings) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = { ...DEFAULT_SETTINGS };

    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  show(): void {
    this.visible = true;
    this.canvas.classList.add('interactive');
  }

  hide(): void {
    this.visible = false;
    this.canvas.classList.remove('interactive');
  }

  isVisible(): boolean {
    return this.visible;
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  onStart(callback: (settings: GameSettings) => void): void {
    this.onStartCallback = callback;
  }

  onSettingsChange(callback: (settings: GameSettings) => void): void {
    this.onSettingsChangeCallback = callback;
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    // Canvas sizing handled by HUD resize
  }

  draw(): void {
    if (!this.visible) return;

    // Semi-transparent dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const panelW = Math.min(460, this.width - 40);
    const panelX = centerX - panelW / 2;

    // Title
    this.ctx.font = '900 42px Orbitron, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GRIDLOCK', centerX, 80);

    // Subtitle
    this.ctx.font = '400 14px Orbitron, sans-serif';
    this.ctx.fillStyle = '#8888aa';
    this.ctx.fillText('simultaneous strategy', centerX, 105);

    // Settings rows
    const rowH = 44;
    const startY = 140;

    for (let i = 0; i < SETTINGS_DEFS.length; i++) {
      const def = SETTINGS_DEFS[i];
      const y = startY + i * rowH;
      const currentVal = this.settings[def.key];

      // Label
      this.ctx.font = '400 13px Orbitron, sans-serif';
      this.ctx.fillStyle = '#ccccdd';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(def.label, panelX, y + 18);

      // Option chips (right-aligned)
      const chipGap = 6;
      const chipH = 28;
      let chipX = panelX + panelW;

      // Draw chips right-to-left
      const chips: { x: number; w: number; idx: number }[] = [];
      for (let j = def.options.length - 1; j >= 0; j--) {
        const text = def.format(def.options[j]);
        this.ctx.font = '400 11px Orbitron, sans-serif';
        const tw = this.ctx.measureText(text).width;
        const chipW = tw + 20;
        chipX -= chipW + chipGap;
        chips.unshift({ x: chipX + chipGap, w: chipW, idx: j });
      }

      for (const chip of chips) {
        const isSelected = def.options[chip.idx] === currentVal;
        const isHovered = this.hoveredSetting === i && this.hoveredOption === chip.idx;
        const chipY = y + 4;

        // Chip background
        if (isSelected) {
          this.ctx.fillStyle = '#3b82f6';
        } else if (isHovered) {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        } else {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        }

        this.roundRect(chip.x, chipY, chip.w, chipH, 6);

        // Chip text
        this.ctx.font = '400 11px Orbitron, sans-serif';
        this.ctx.fillStyle = isSelected ? '#ffffff' : '#aaaacc';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          def.format(def.options[chip.idx]),
          chip.x + chip.w / 2,
          chipY + chipH / 2 + 4,
        );
      }
    }

    // START GAME button
    const btnW = 220;
    const btnH = 48;
    const btnX = centerX - btnW / 2;
    const btnY = startY + SETTINGS_DEFS.length * rowH + 30;

    this.ctx.fillStyle = this.startButtonHovered ? '#2563eb' : '#3b82f6';
    this.roundRect(btnX, btnY, btnW, btnH, 8);

    this.ctx.font = '700 16px Orbitron, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START GAME', centerX, btnY + btnH / 2 + 6);

    // Store button bounds for hit testing
    (this as any)._btnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
    (this as any)._panelX = panelX;
    (this as any)._panelW = panelW;
    (this as any)._startY = startY;
    (this as any)._rowH = rowH;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private handleClick(e: MouseEvent): void {
    if (!this.visible) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check start button
    const btn = (this as any)._btnBounds;
    if (btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      this.onStartCallback?.(this.getSettings());
      return;
    }

    // Check setting chips
    const hit = this.hitTestChip(x, y);
    if (hit) {
      const def = SETTINGS_DEFS[hit.settingIdx];
      const newVal = def.options[hit.optionIdx];
      (this.settings as any)[def.key] = newVal;
      this.onSettingsChangeCallback?.(this.getSettings());
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.visible) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check start button hover
    const btn = (this as any)._btnBounds;
    this.startButtonHovered = btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;

    // Check chip hover
    const hit = this.hitTestChip(x, y);
    if (hit) {
      this.hoveredSetting = hit.settingIdx;
      this.hoveredOption = hit.optionIdx;
      this.canvas.style.cursor = 'pointer';
    } else if (this.startButtonHovered) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.hoveredSetting = -1;
      this.hoveredOption = -1;
      this.canvas.style.cursor = 'default';
    }
  }

  private hitTestChip(mx: number, my: number): { settingIdx: number; optionIdx: number } | null {
    const panelX = (this as any)._panelX as number | undefined;
    const panelW = (this as any)._panelW as number | undefined;
    const startY = (this as any)._startY as number | undefined;
    const rowH = (this as any)._rowH as number | undefined;

    if (!panelX || !panelW || !startY || !rowH) return null;

    for (let i = 0; i < SETTINGS_DEFS.length; i++) {
      const def = SETTINGS_DEFS[i];
      const y = startY + i * rowH;
      const chipH = 28;
      const chipY = y + 4;

      if (my < chipY || my > chipY + chipH) continue;

      // Compute chip positions (same as draw)
      const chipGap = 6;
      let chipX = panelX + panelW;
      const chips: { x: number; w: number; idx: number }[] = [];

      this.ctx.font = '400 11px Orbitron, sans-serif';
      for (let j = def.options.length - 1; j >= 0; j--) {
        const text = def.format(def.options[j]);
        const tw = this.ctx.measureText(text).width;
        const chipW = tw + 20;
        chipX -= chipW + chipGap;
        chips.unshift({ x: chipX + chipGap, w: chipW, idx: j });
      }

      for (const chip of chips) {
        if (mx >= chip.x && mx <= chip.x + chip.w) {
          return { settingIdx: i, optionIdx: chip.idx };
        }
      }
    }

    return null;
  }
}
