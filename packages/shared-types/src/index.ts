// User types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streakDays: number;
  lastLogin: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl?: string;
  level: number;
}

// Game types
export type GameCategory = 'arcade' | 'puzzle' | 'strategy' | 'io' | 'party' | 'word' | 'card' | 'sports';

export interface GameManifest {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  tags: string[];
  thumbnail: string;
  entry: string;
  multiplayer?: {
    minPlayers: number;
    maxPlayers: number;
    modes: string[];
    roomType: string;
  };
  version: string;
}

export interface Game extends GameManifest {
  playCount: number;
}

// Score / Leaderboard
export interface Score {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

// Achievement
export interface Achievement {
  id: string;
  gameId: string;
  name: string;
  description: string;
  xpReward: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

// Activity
export type ActivityType = 'score' | 'achievement' | 'level_up' | 'streak';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  gameId?: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

// Room / Multiplayer
export interface RoomInfo {
  roomId: string;
  gameId: string;
  code: string;
  playerCount: number;
  maxPlayers: number;
  state: 'waiting' | 'playing' | 'finished';
}
