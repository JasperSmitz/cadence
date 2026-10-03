import "server-only";
import { openDatabase } from "./connection";

// Lazy initialization prevents opening a database during static builds.
const globalDatabase = globalThis as typeof globalThis & {
  cadenceDatabase?: ReturnType<typeof openDatabase>;
};
export function getDatabase() {
  globalDatabase.cadenceDatabase ??= openDatabase(
    process.env.DATABASE_PATH ?? "./data/cadence.sqlite",
  );
  return globalDatabase.cadenceDatabase.db;
}
