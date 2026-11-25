import { describe, expect, it } from "vitest";
import { addDays, datesBetween, emptyLog, parseISODate, scaleItem, sumItems, toISODate } from "../../src/lib/dates";
import type { FoodItem } from "../../src/lib/types";

const item = (over: Partial<FoodItem> = {}): FoodItem =>
  ({ name: "Rice", quantity: "100 g", calories: 130, macros: { protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 }, micros: {}, ...over }) as FoodItem;

describe("date helpers", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("parses an ISO date as local midnight", () => {
    expect(parseISODate("2026-11-25").getHours()).toBe(0);
  });
  it("lists every day in an inclusive range", () => {
    expect(datesBetween("2026-02-27", "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
    expect(datesBetween("2026-03-02", "2026-03-01")).toEqual([]);
  });
  it("creates an empty log for a date", () => {
    const log = emptyLog("2026-11-25");
    expect(log.date).toBe("2026-11-25");
    expect(log.meals).toEqual([]);
    expect(log.submitted).toBe(false);
  });
});

describe("food item scaling", () => {
  it("scales calories and every macro by the factor", () => {
    const s = scaleItem(item(), 2);
    expect(s.calories).toBe(260);
    expect(s.macros.carbs_g).toBe(56);
  });
  it("rounds scaled values to two decimals", () => {
    expect(scaleItem(item(), 1 / 3).macros.protein_g).toBe(0.9);
  });
  it("sums several items into one total", () => {
    const second = item({ calories: 70, macros: { protein_g: 1, carbs_g: 2, fat_g: 3, fiber_g: 4 } as FoodItem["macros"] });
    const total = sumItems("Lunch", "1 plate", [item(), second]);
    expect(total.name).toBe("Lunch");
    expect(total.quantity).toBe("1 plate");
    expect(total.calories).toBe(200);
    expect(total.macros.fat_g).toBeCloseTo(3.3, 9);
  });
});
