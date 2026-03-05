/**
 * Portal-side SDK host. Manages communication with game iframes.
 */

import {
  type PlayerData,
  type GameToPortalMessage,
  GAMEVAULT_MSG_PREFIX,
} from './types';

export interface GameHostCallbacks {
  onReady?: (version: string) => void;
  onScoreSubmit?: (score: number, metadata?: Record<string, unknown>) => void;
  onAchievementUnlock?: (achievementId: string) => void;
  onSaveState?: (key: string, data: unknown) => void;
  onLoadState?: (key: string) => unknown | null;
}

export class GameHost {
  private iframe: HTMLIFrameElement | null = null;
  private callbacks: GameHostCallbacks;
  private boundHandler: (event: MessageEvent) => void;

  constructor(callbacks: GameHostCallbacks = {}) {
    this.callbacks = callbacks;
    this.boundHandler = this.handleMessage.bind(this);
  }

  attach(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
    window.addEventListener('message', this.boundHandler);
  }

  detach(): void {
    window.removeEventListener('message', this.boundHandler);
    this.iframe = null;
  }

  sendInit(player: PlayerData, muted: boolean = false): void {
    this.send({
      type: 'INIT',
      payload: { player, settings: { muted } },
    });
  }

  sendPause(): void {
    this.send({ type: 'PAUSE' });
  }

  sendResume(): void {
    this.send({ type: 'RESUME' });
  }

  sendMute(muted: boolean): void {
    this.send({ type: 'MUTE', payload: { muted } });
  }

  private send(msg: Record<string, unknown>): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { prefix: GAMEVAULT_MSG_PREFIX, ...msg },
        '*',
      );
    }
  }

  private handleMessage(event: MessageEvent): void {
    const data = event.data;
    if (!data || data.prefix !== GAMEVAULT_MSG_PREFIX) return;

    // Verify message source is our iframe
    if (this.iframe && event.source !== this.iframe.contentWindow) return;

    const msg = data as GameToPortalMessage & { prefix: string };
    switch (msg.type) {
      case 'READY':
        this.callbacks.onReady?.(msg.payload.version);
        break;
      case 'SCORE_SUBMIT':
        this.callbacks.onScoreSubmit?.(msg.payload.score, msg.payload.metadata);
        break;
      case 'ACHIEVEMENT_UNLOCK':
        this.callbacks.onAchievementUnlock?.(msg.payload.achievementId);
        break;
      case 'SAVE_STATE':
        this.callbacks.onSaveState?.(msg.payload.key, msg.payload.data);
        break;
      case 'LOAD_STATE': {
        const result = this.callbacks.onLoadState?.(msg.payload.key) ?? null;
        this.send({
          type: 'STATE_LOADED',
          payload: { key: msg.payload.key, data: result },
        });
        break;
      }
    }
  }
}
