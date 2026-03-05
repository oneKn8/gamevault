import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { users } from "../schema";

export async function getUserById(id: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUserByUsername(username: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.username, username),
  });
}

export async function updateUserXp(
  userId: string,
  newXp: number,
  newLevel: number
) {
  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ xp: newXp, level: newLevel, lastPlayedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}
