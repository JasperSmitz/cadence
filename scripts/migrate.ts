import nextEnv from "@next/env";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDatabase } from "../src/db/connection";
nextEnv.loadEnvConfig(process.cwd());
const path = process.env.DATABASE_PATH ?? "./data/cadence.sqlite";
const { db, sqlite } = openDatabase(path);
try {
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migrations applied to ${path}`);
} finally {
  sqlite.close();
}
