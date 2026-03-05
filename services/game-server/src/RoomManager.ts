import { nanoid } from 'nanoid';
import { Room } from './Room.js';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), 30000);
  }

  createRoom(gameId: string): Room {
    const code = nanoid(6).toUpperCase();
    const room = new Room(code, gameId);
    room.onEmpty = () => {
      this.rooms.delete(code);
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  listRooms(gameId?: string): Array<{ code: string; gameId: string; playerCount: number; phase: string }> {
    const result = [];
    for (const [, room] of this.rooms) {
      if (gameId && room.gameId !== gameId) continue;
      if (room.phase !== 'waiting') continue;
      result.push({
        code: room.code,
        gameId: room.gameId,
        playerCount: room.playerCount,
        phase: room.phase,
      });
    }
    return result;
  }

  private cleanupStaleRooms(): void {
    for (const [code, room] of this.rooms) {
      if (room.isStale()) {
        room.cleanup();
        this.rooms.delete(code);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    for (const [, room] of this.rooms) {
      room.cleanup();
    }
    this.rooms.clear();
  }
}
