import { z } from "zod";

export const numericFields = [
  ["energyCentiKcalPer100g", "Energy", "kcal", 2, 100000, false],
  ["proteinMgPer100g", "Protein", "g", 3, 100000, false],
  [
    "carbohydrateMgPer100g",
    "Carbohydrate (excluding fiber)",
    "g",
    3,
    100000,
    false,
  ],
  ["fatMgPer100g", "Fat", "g", 3, 100000, false],
  ["fiberMgPer100g", "Fiber", "g", 3, 100000, true],
  ["servingSizeMg", "Reference serving weight", "g", 3, 1000000000, true],
  ["packageSizeMg", "Package weight", "g", 3, 1000000000, true],
] as const;
export type NumericField = (typeof numericFields)[number][0];
export type FoodInput = {
  name: string;
  servingLabel: string | null;
  notes: string | null;
} & Record<NumericField, number | null>;
export type FieldErrors = Record<string, string>;

export function parseDecimal(value: string, precision: number): number {
  const text = value.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(text))
    throw new Error(
      "Enter a plain decimal using . or , without thousands separators.",
    );
  const [whole, fraction = ""] = text.split(/[.,]/);
  if (fraction.length > precision)
    throw new Error(`Use at most ${precision} decimal places.`);
  const exact =
    BigInt(whole) * 10n ** BigInt(precision) +
    BigInt(fraction.padEnd(precision, "0"));
  if (exact > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("This value is too large.");
  return Number(exact);
}
export function formatDecimal(value: number | null, precision: number): string {
  if (value === null) return "";
  const digits = value.toString().padStart(precision + 1, "0");
  const fraction = digits.slice(-precision).replace(/0+$/, "");
  return digits.slice(0, -precision) + (fraction ? `.${fraction}` : "");
}
export function validateFood(
  raw: Record<string, unknown>,
): { data: FoodInput; errors?: never } | { errors: FieldErrors; data?: never } {
  const errors: FieldErrors = {};
  const text = (key: string, max: number, required = false): string | null => {
    if (typeof raw[key] !== "string") {
      errors[key] = "Expected text.";
      return null;
    }
    const value = raw[key].trim();
    if (!value && required) errors[key] = "Required.";
    if ([...value].length > max) errors[key] = `Use at most ${max} characters.`;
    return value || null;
  };
  const data = {
    name: text("name", 200, true) ?? "",
    servingLabel: text("servingLabel", 100),
    notes: text("notes", 2000),
  } as FoodInput;
  for (const [key, , unit, precision, max, optional] of numericFields) {
    data[key] = null;
    if (typeof raw[key] !== "string") {
      errors[key] = "Expected a decimal value.";
      continue;
    }
    if (!raw[key].trim()) {
      if (!optional) errors[key] = "Required.";
      continue;
    }
    try {
      const value = parseDecimal(raw[key], precision);
      const min = key === "servingSizeMg" || key === "packageSizeMg" ? 1 : 0;
      if (value < min || value > max)
        throw new Error(
          `Enter ${formatDecimal(min, precision)}–${formatDecimal(max, precision)} ${unit}.`,
        );
      data[key] = value;
    } catch (error) {
      errors[key] = (error as Error).message;
    }
  }
  if (data.servingLabel && data.servingSizeMg === null)
    errors.servingSizeMg = "A serving label requires a weight.";
  return Object.keys(errors).length ? { errors } : { data };
}
export function validFoodId(value: unknown): value is string {
  return z.uuid().safeParse(value).success;
}
