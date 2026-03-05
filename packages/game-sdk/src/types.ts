// Portal -> Game messages
export type PortalToGameMessage =
  | { type: 'INIT'; payload: { player: PlayerData; settings: GameSettings } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'MUTE'; payload: { muted: boolean } };

// Game -> Portal messages
export type GameToPortalMessage =
  | { type: 'READY'; payload: { version: string } }
  | { type: 'SCORE_SUBMIT'; payload: { score: number; metadata?: Record<string, unknown> } }
  | { type: 'ACHIEVEMENT_UNLOCK'; payload: { achievementId: string } }
  | { type: 'SAVE_STATE'; payload: { key: string; data: unknown } }
  | { type: 'LOAD_STATE'; payload: { key: string } }
  | { type: 'STATE_LOADED'; payload: { key: string; data: unknown | null } };

export interface PlayerData {
  id: string;
  username: string;
  avatarUrl?: string;
  level: number;
}

export interface GameSettings {
  muted: boolean;
}

export const GAMEVAULT_MSG_PREFIX = 'gamevault:' as const;
