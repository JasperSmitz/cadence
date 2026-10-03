import { describe, expect, it } from "vitest";
import {
  formatDecimal,
  numericFields,
  parseDecimal,
  validateFood,
  validFoodId,
} from "./validation";
export const input = {
  name: " Rice, dry ",
  energyCentiKcalPer100g: "123.45",
  proteinMgPer100g: "12.345",
  carbohydrateMgPer100g: "60",
  fatMgPer100g: "1",
  fiberMgPer100g: "",
  servingSizeMg: "",
  servingLabel: "",
  packageSizeMg: "",
  notes: "",
};
describe("decimal input", () => {
  it.each([
    ["12.345", 3, 12345],
    ["12,345", 3, 12345],
    ["0.001", 3, 1],
    ["123.45", 2, 12345],
    ["0", 2, 0],
    [" 001.20 ", 2, 120],
  ])("parses %s exactly", (text, precision, result) => {
    expect(parseDecimal(text, precision)).toBe(result);
  });
  it.each([
    "",
    "1e2",
    "1,000.00",
    "1.000,00",
    "1 000",
    "-1",
    "NaN",
    "Infinity",
    "1.2345",
    "1,2,3",
    "+1",
  ])("rejects %s", (value) => {
    expect(() => parseDecimal(value, 3)).toThrow();
  });
  it("rejects excess kcal precision even if trailing zero", () => {
    expect(() => parseDecimal("1.000", 2)).toThrow(/decimal places/);
  });
  it("rejects unsafe values", () => {
    expect(() => parseDecimal("9999999999999999999", 3)).toThrow();
  });
  it.each([0, 1, 1001, 12345, 100000, 1000000000])(
    "round trips %s without rounding",
    (value) => {
      for (const precision of [2, 3])
        expect(parseDecimal(formatDecimal(value, precision), precision)).toBe(
          value,
        );
    },
  );
});
describe("food validation", () => {
  it("trims text and distinguishes blank from zero", () => {
    const blank = validateFood(input);
    expect(blank.data).toMatchObject({
      name: "Rice, dry",
      fiberMgPer100g: null,
      notes: null,
      servingLabel: null,
      servingSizeMg: null,
      packageSizeMg: null,
    });
    expect(
      validateFood({ ...input, fiberMgPer100g: "0" }).data?.fiberMgPer100g,
    ).toBe(0);
    expect(
      validateFood({ ...input, proteinMgPer100g: " " }).errors
        ?.proteinMgPer100g,
    ).toBe("Required.");
  });
  it("enforces serving conversion and independent energy", () => {
    expect(
      validateFood({ ...input, servingLabel: "slice" }).errors?.servingSizeMg,
    ).toBeTruthy();
    expect(
      validateFood({
        ...input,
        servingSizeMg: "35",
        energyCentiKcalPer100g: "0",
      }).data?.servingSizeMg,
    ).toBe(35000);
  });
  it("preserves every numeric boundary", () => {
    for (const [key, , , precision, max] of numericFields) {
      expect(
        validateFood({ ...input, [key]: formatDecimal(max, precision) }).errors,
      ).toBeUndefined();
      expect(
        validateFood({ ...input, [key]: formatDecimal(max + 1, precision) })
          .errors?.[key],
      ).toBeTruthy();
    }
    expect(
      validateFood({ ...input, packageSizeMg: "0" }).errors?.packageSizeMg,
    ).toBeTruthy();
  });
  it("validates text bounds and untrusted types", () => {
    for (const [key, max] of [
      ["name", 200],
      ["servingLabel", 100],
      ["notes", 2000],
    ] as const) {
      expect(
        validateFood({ ...input, servingSizeMg: "1", [key]: "x".repeat(max) })
          .errors,
      ).toBeUndefined();
      expect(
        validateFood({ ...input, [key]: "x".repeat(max + 1) }).errors?.[key],
      ).toBeTruthy();
    }
    expect(
      validateFood({ ...input, proteinMgPer100g: 1 }).errors?.proteinMgPer100g,
    ).toBeTruthy();
    expect(validateFood({ ...input, name: null }).errors?.name).toBeTruthy();
    expect(validFoodId("x".repeat(36))).toBe(false);
  });
});
