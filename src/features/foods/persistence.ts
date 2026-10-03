import "server-only";
import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import type { openDatabase } from "../../db/connection";
import { foods } from "../../db/schema";
import { validFoodId, validateFood } from "./validation";

type Database = ReturnType<typeof openDatabase>["db"];
export type Food = typeof foods.$inferSelect;
export function listFoods(db: Database, search = "") {
  return db
    .select()
    .from(foods)
    .where(sql`instr(lower(${foods.name}), lower(${search.trim()})) > 0`)
    .orderBy(asc(foods.name), asc(foods.id))
    .all();
}
export function saveFood(
  db: Database,
  raw: Record<string, unknown>,
  id?: unknown,
) {
  if (id !== undefined && !validFoodId(id))
    return { ok: false as const, message: "Invalid food ID." };
  const result = validateFood(raw);
  if (result.errors)
    return {
      ok: false as const,
      message: "Please check the highlighted fields.",
      errors: result.errors,
    };
  const data = result.data;
  // Validation guarantees required numeric fields are present.
  const values = {
    ...data,
    energyCentiKcalPer100g: data.energyCentiKcalPer100g!,
    proteinMgPer100g: data.proteinMgPer100g!,
    carbohydrateMgPer100g: data.carbohydrateMgPer100g!,
    fatMgPer100g: data.fatMgPer100g!,
  };
  if (id !== undefined) {
    const existing = db
      .select()
      .from(foods)
      .where(eq(foods.id, id as string))
      .get();
    if (!existing)
      return {
        ok: false as const,
        message:
          "This food no longer exists. Close the editor and refresh the list.",
      };
    const updated = db
      .update(foods)
      .set({ ...values, updatedAt: Math.max(Date.now(), existing.updatedAt) })
      .where(eq(foods.id, existing.id))
      .returning()
      .get();
    if (!updated)
      return { ok: false as const, message: "This food no longer exists." };
    return { ok: true as const, message: "Food updated." };
  }
  const now = Date.now();
  db.insert(foods)
    .values({ ...values, id: randomUUID(), createdAt: now, updatedAt: now })
    .run();
  return { ok: true as const, message: "Food added." };
}
export function deleteFood(db: Database, id: unknown) {
  if (!validFoodId(id))
    return { ok: false as const, message: "Invalid food ID." };
  const deleted = db
    .delete(foods)
    .where(eq(foods.id, id))
    .returning({ id: foods.id })
    .get();
  return deleted
    ? { ok: true as const, message: "Food deleted." }
    : {
        ok: false as const,
        message: "This food no longer exists. Refresh the list.",
      };
}
