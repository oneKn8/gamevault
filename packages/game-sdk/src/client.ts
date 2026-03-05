/**
 * Game-side SDK. Used inside game iframes to communicate with the portal.
 * Also works standalone using localStorage fallback.
 */

import {
  type PlayerData,
  type GameSettings,
  type PortalToGameMessage,
  type GameToPortalMessage,
  GAMEVAULT_MSG_PREFIX,
} from './types';

const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

let player: PlayerData = { id: 'guest', username: 'Guest', level: 1 };
let settings: GameSettings = { muted: false };
let initialized = false;

type EventHandler = (data: unknown) => void;
const listeners = new Map<string, EventHandler[]>();

function sendToPortal(msg: GameToPortalMessage): void {
  if (isEmbedded) {
    window.parent.postMessage({ prefix: GAMEVAULT_MSG_PREFIX, ...msg }, '*');
  }
}

function handlePortalMessage(event: MessageEvent): void {
  const data = event.data;
  if (!data || data.prefix !== GAMEVAULT_MSG_PREFIX) return;

  const msg = data as PortalToGameMessage & { prefix: string };
  switch (msg.type) {
    case 'INIT':
      player = msg.payload.player;
      settings = msg.payload.settings;
      initialized = true;
      emit('init', { player, settings });
      break;
    case 'PAUSE':
      emit('pause', undefined);
      break;
    case 'RESUME':
      emit('resume', undefined);
      break;
    case 'MUTE':
      settings.muted = msg.payload.muted;
      emit('mute', { muted: settings.muted });
      break;
  }
}

function emit(event: string, data: unknown): void {
  const handlers = listeners.get(event);
  if (handlers) {
    for (const handler of handlers) handler(data);
  }
}

export const GameVault = {
  init(): void {
    if (typeof window === 'undefined') return;

    if (isEmbedded) {
      window.addEventListener('message', handlePortalMessage);
      sendToPortal({ type: 'READY', payload: { version: '0.1.0' } });
    } else {
      // Standalone mode: use defaults
      initialized = true;
      emit('init', { player, settings });
    }
  },

  isEmbedded(): boolean {
    return isEmbedded;
  },

  isReady(): boolean {
    return initialized;
  },

  getPlayer(): PlayerData {
    return player;
  },

  getSettings(): GameSettings {
    return settings;
  },

  submitScore(score: number, metadata?: Record<string, unknown>): void {
    if (isEmbedded) {
      sendToPortal({ type: 'SCORE_SUBMIT', payload: { score, metadata } });
    } else {
      // Standalone: save to localStorage
      const key = 'gamevault:highscore';
      const current = Number(localStorage.getItem(key) || '0');
      if (score > current) {
        localStorage.setItem(key, String(score));
      }
    }
  },

  unlockAchievement(achievementId: string): void {
    if (isEmbedded) {
      sendToPortal({ type: 'ACHIEVEMENT_UNLOCK', payload: { achievementId } });
    }
  },

  saveState(key: string, data: unknown): void {
    if (isEmbedded) {
      sendToPortal({ type: 'SAVE_STATE', payload: { key, data } });
    } else {
      localStorage.setItem(`gamevault:state:${key}`, JSON.stringify(data));
    }
  },

  loadState<T = unknown>(key: string): T | null {
    if (!isEmbedded) {
      const raw = localStorage.getItem(`gamevault:state:${key}`);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  },

  on(event: string, handler: EventHandler): void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(handler);
  },

  off(event: string, handler: EventHandler): void {
    const handlers = listeners.get(event);
    if (handlers) {
      listeners.set(event, handlers.filter(h => h !== handler));
    }
  },

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handlePortalMessage);
    }
    listeners.clear();
  },
};
