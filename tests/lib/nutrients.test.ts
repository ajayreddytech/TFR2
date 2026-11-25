import { describe, expect, it } from "vitest";
import { MACRO_KEYS, MICRO_KEYS, NUTRIENT_KEYS, topSources } from "../../src/lib/nutrients";
import type { FoodItem } from "../../src/lib/types";

const food = (name: string, protein: number) =>
  ({ name, quantity: "1", calories: 0, macros: { protein_g: protein }, micros: {} }) as unknown as FoodItem;

describe("nutrient keys", () => {
  it("has no key in both the macro and micro lists", () => {
    const overlap = MACRO_KEYS.filter((k) => MICRO_KEYS.includes(k));
    expect(overlap).toEqual([]);
  });
  it("covers every nutrient key exactly once across macros and micros", () => {
    expect(new Set(NUTRIENT_KEYS).size).toBe(NUTRIENT_KEYS.length);
    expect([...MACRO_KEYS, ...MICRO_KEYS].sort()).toEqual([...NUTRIENT_KEYS].sort());
  });
});

describe("topSources", () => {
  it("ranks foods by their share of the total", () => {
    const r = topSources([food("Egg", 6), food("Chicken", 24), food("Rice", 2)], "protein_g");
    expect(r.total).toBe(32);
    expect(r.sources.map((s) => s.name)).toEqual(["Chicken", "Egg", "Rice"]);
    expect(r.sources[0].share).toBeCloseTo(0.75, 9);
  });
  it("returns no sources when no food has the nutrient", () => {
    expect(topSources([food("Rice", 2)], "vitamin_c_mg")).toEqual({ sources: [], total: 0 });
  });
  it("limits the result to the requested number of sources", () => {
    const r = topSources([food("A", 1), food("B", 2), food("C", 3)], "protein_g", 2);
    expect(r.sources).toHaveLength(2);
  });
});
