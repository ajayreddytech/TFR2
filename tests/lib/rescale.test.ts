import { describe, expect, it } from "vitest";
import { parseQuantity, rescaleItem } from "../../src/lib/rescale";
import type { FoodItem } from "../../src/lib/types";

const base = { name: "Oats", quantity: "100 g", calories: 380, macros: { protein_g: 13, carbs_g: 67, fat_g: 7, fiber_g: 10 }, micros: {} } as FoodItem;

describe("parseQuantity", () => {
  it("splits a number and unit", () => {
    expect(parseQuantity("200 g")).toEqual({ n: 200, unit: "g" });
  });
  it("accepts decimals and leading-dot numbers", () => {
    expect(parseQuantity("1.5 cups")).toEqual({ n: 1.5, unit: "cup" });
    expect(parseQuantity(".5 l")).toEqual({ n: 0.5, unit: "l" });
  });
  it("treats a plural unit as its singular", () => {
    expect(parseQuantity("2 idlis")?.unit).toBe("idli");
  });
  it("returns null for zero, text or empty input", () => {
    expect(parseQuantity("0 g")).toBeNull();
    expect(parseQuantity("some rice")).toBeNull();
    expect(parseQuantity("")).toBeNull();
  });
});

describe("rescaleItem", () => {
  it("scales nutrition from the base quantity", () => {
    const r = rescaleItem(base, "200 g");
    expect(r?.calories).toBe(760);
    expect(r?.quantity).toBe("200 g");
  });
  it("returns null when the units differ", () => {
    expect(rescaleItem(base, "1 cup")).toBeNull();
  });
  it("returns null when the new quantity cannot be parsed", () => {
    expect(rescaleItem(base, "a handful")).toBeNull();
  });
});
