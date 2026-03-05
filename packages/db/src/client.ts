import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // During build time, DATABASE_URL may not be available.
    // Return a drizzle instance with a dummy connection that will
    // fail on actual queries but allows module evaluation to succeed.
    const dummySql = neon("postgresql://build:build@localhost/build");
    return drizzle(dummySql, { schema });
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type Database = ReturnType<typeof createDb>;
