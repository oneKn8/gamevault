import { GameEvent } from '../types';

type Handler = (payload?: any) => void;

export class EventBus {
  private listeners = new Map<GameEvent, Handler[]>();

  on(event: GameEvent, handler: Handler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: GameEvent, handler: Handler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }

  emit(event: GameEvent, payload?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
