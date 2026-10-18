import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// All nutrition is per 100 g. Carbohydrates exclude fiber (EU convention).
// mg encodes grams to 3 decimal places; centi-kcal encodes kcal to 2.
export const foods = sqliteTable(
  "foods",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    energyCentiKcalPer100g: integer("energy_centi_kcal_per_100g").notNull(),
    proteinMgPer100g: integer("protein_mg_per_100g").notNull(),
    carbohydrateMgPer100g: integer("carbohydrate_mg_per_100g").notNull(),
    fatMgPer100g: integer("fat_mg_per_100g").notNull(),
    fiberMgPer100g: integer("fiber_mg_per_100g"),
    servingSizeMg: integer("serving_size_mg"),
    servingLabel: text("serving_label"),
    packageSizeMg: integer("package_size_mg"),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("foods_name_idx").on(t.name),
    check("foods_id_valid", sql`length(${t.id}) = 36`),
    check(
      "foods_name_valid",
      sql`length(trim(${t.name})) between 1 and 200 and ${t.name} = trim(${t.name})`,
    ),
    check(
      "foods_energy_valid",
      sql`typeof(${t.energyCentiKcalPer100g}) = 'integer' and ${t.energyCentiKcalPer100g} between 0 and 100000`,
    ),
    ...[
      t.proteinMgPer100g,
      t.carbohydrateMgPer100g,
      t.fatMgPer100g,
      t.fiberMgPer100g,
    ].map((column) =>
      check(
        `foods_${column.name}_valid`,
        sql`${column} is null or (typeof(${column}) = 'integer' and ${column} between 0 and 100000)`,
      ),
    ),
    ...[t.servingSizeMg, t.packageSizeMg].map((column) =>
      check(
        `foods_${column.name}_valid`,
        sql`${column} is null or (typeof(${column}) = 'integer' and ${column} between 1 and 1000000000)`,
      ),
    ),
    check(
      "foods_serving_label_valid",
      sql`${t.servingLabel} is null or (${t.servingSizeMg} is not null and length(trim(${t.servingLabel})) between 1 and 100 and ${t.servingLabel} = trim(${t.servingLabel}))`,
    ),
    check(
      "foods_notes_valid",
      sql`${t.notes} is null or (length(trim(${t.notes})) between 1 and 2000 and ${t.notes} = trim(${t.notes}))`,
    ),
    check(
      "foods_timestamps_valid",
      sql`typeof(${t.createdAt}) = 'integer' and typeof(${t.updatedAt}) = 'integer' and ${t.createdAt} >= 0 and ${t.updatedAt} >= ${t.createdAt} and ${t.updatedAt} <= 9007199254740991`,
    ),
  ],
);
