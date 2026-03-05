export * from "./schema";
export { getDb, type Database } from "./client";
export {
  insertScore,
  getTopScores,
  getUserBestScore,
} from "./queries/scores";
export {
  getUserById,
  getUserByUsername,
  updateUserXp,
} from "./queries/users";
