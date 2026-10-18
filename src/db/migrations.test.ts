import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./connection";
import { foods } from "./schema";

describe("database foundation", () => {
  it("migrates a fresh file, persists exact integers, and can migrate again", () => {
    const directory = mkdtempSync(join(tmpdir(), "cadence-test-"));
    const path = join(directory, "fresh.sqlite");
    const first = openDatabase(path);
    try {
      migrate(first.db, { migrationsFolder: "./drizzle" });
      expect(first.sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
      expect(first.sqlite.pragma("journal_mode", { simple: true })).toBe("wal");
      first.db
        .insert(foods)
        .values({
          id: randomUUID(),
          name: "Oats, raw",
          energyCentiKcalPer100g: 37250,
          proteinMgPer100g: 12340,
          carbohydrateMgPer100g: 60000,
          fatMgPer100g: 7000,
          fiberMgPer100g: null,
          servingSizeMg: 35000,
          servingLabel: "scoop",
          notes: "Label values",
          createdAt: 1000,
          updatedAt: 1000,
        })
        .run();
    } finally {
      first.sqlite.close();
    }
    const second = openDatabase(path);
    try {
      migrate(second.db, { migrationsFolder: "./drizzle" });
      const rows = second.db.select().from(foods).all();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        proteinMgPer100g: 12340,
        fiberMgPer100g: null,
        servingSizeMg: 35000,
      });
      expect(() =>
        second.sqlite
          .prepare("UPDATE foods SET protein_mg_per_100g = 1.5")
          .run(),
      ).toThrow();
      expect(() =>
        second.sqlite.prepare("UPDATE foods SET fat_mg_per_100g = -1").run(),
      ).toThrow();
      expect(() =>
        second.sqlite.prepare("UPDATE foods SET serving_size_mg = NULL").run(),
      ).toThrow();
      expect(() =>
        second.sqlite.prepare("UPDATE foods SET updated_at = 999").run(),
      ).toThrow();
    } finally {
      second.sqlite.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
