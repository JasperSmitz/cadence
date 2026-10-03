import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { openDatabase } from "../../db/connection";
import { deleteFood, listFoods, saveFood } from "./persistence";
import { formatDecimal, numericFields } from "./validation";
const input = {
  name: "Rice, dry",
  energyCentiKcalPer100g: "123.45",
  proteinMgPer100g: "12.345",
  carbohydrateMgPer100g: "60",
  fatMgPer100g: "1",
  fiberMgPer100g: "0",
  servingSizeMg: "35.001",
  servingLabel: "scoop",
  packageSizeMg: "1000.123",
  notes: "raw",
};
it("creates, searches, edits without precision loss, persists, and deletes in isolation", () => {
  const directory = mkdtempSync(join(tmpdir(), "cadence-foods-"));
  const path = join(directory, "foods.sqlite");
  let connection = openDatabase(path);
  try {
    migrate(connection.db, { migrationsFolder: "./drizzle" });
    expect(saveFood(connection.db, input).ok).toBe(true);
    expect(saveFood(connection.db, input).ok).toBe(true);
    expect(listFoods(connection.db, "RICE")).toHaveLength(2);
    expect(listFoods(connection.db, "%")).toHaveLength(0);
    const food = listFoods(connection.db)[0];
    expect(food.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(food.createdAt).toBeGreaterThan(0);
    const unchanged: Record<string, unknown> = {
      name: food.name,
      servingLabel: food.servingLabel ?? "",
      notes: food.notes ?? "",
    };
    for (const [key, , , precision] of numericFields)
      unchanged[key] = formatDecimal(food[key], precision);
    expect(saveFood(connection.db, unchanged, food.id).ok).toBe(true);
    connection.sqlite.close();
    connection = openDatabase(path);
    const updated = listFoods(connection.db).find((row) => row.id === food.id)!;
    expect({ ...updated, updatedAt: food.updatedAt }).toEqual(food);
    expect(
      saveFood(
        connection.db,
        { ...input, name: "Rice, cooked", fiberMgPer100g: "", notes: "" },
        food.id,
      ).ok,
    ).toBe(true);
    expect(listFoods(connection.db, "cooked")[0]).toMatchObject({
      fiberMgPer100g: null,
      notes: null,
      createdAt: food.createdAt,
    });
    expect(saveFood(connection.db, { ...input, proteinMgPer100g: "" }).ok).toBe(
      false,
    );
    expect(listFoods(connection.db)).toHaveLength(2);
    expect(saveFood(connection.db, input, "x".repeat(36)).ok).toBe(false);
    expect(deleteFood(connection.db, "invalid").ok).toBe(false);
    expect(saveFood(connection.db, input, randomUUID()).ok).toBe(false);
    expect(deleteFood(connection.db, randomUUID()).ok).toBe(false);
    expect(deleteFood(connection.db, food.id).ok).toBe(true);
    expect(deleteFood(connection.db, food.id).ok).toBe(false);
    expect(saveFood(connection.db, input, food.id).ok).toBe(false);
    expect(listFoods(connection.db)).toHaveLength(1);
  } finally {
    connection.sqlite.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
