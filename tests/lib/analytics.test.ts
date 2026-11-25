import { describe, expect, it } from "vitest";
import { aggregateNutrients, calorieTarget, dayPoints, dietaryInsights, extraInsights, isLogged, nutrientStatus, summarize } from "../../src/lib/analytics";
import { DEFAULT_CALORIE_TARGET } from "../../src/lib/calc";
import { DEFAULT_PROFILE } from "../../src/lib/store";
import type { DailyLog, FoodItem, Profile } from "../../src/lib/types";

const food = (calories: number, over: Partial<FoodItem["macros"]> = {}): FoodItem => ({
  name: "Food", quantity: "1", calories,
  macros: { protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, ...over }, micros: {},
});

const log = (date: string, over: Partial<DailyLog> = {}): DailyLog => ({
  date, meals: [], expenditure: 0, hydrationL: 0, gyr: null, nibbles: null, firstMealAt: null, lastMealAt: null, fasted: false, submitted: false, ...over,
});

const fullProfile: Profile = { ...DEFAULT_PROFILE, dob: "1990-01-01", gender: "male", heightCm: 175, weightKg: 80, activity: "sedentary" };

describe("calorieTarget", () => {
  it("uses the default target when the profile is incomplete", () => {
    expect(calorieTarget(DEFAULT_PROFILE)).toBe(DEFAULT_CALORIE_TARGET);
  });

  it("uses the estimated daily energy need when the profile is complete", () => {
    const t = calorieTarget(fullProfile);
    expect(t).toBeGreaterThan(1500);
    expect(t).toBeLessThan(3000);
  });
});

describe("isLogged", () => {
  it("treats an empty, unsubmitted day as not logged", () => {
    expect(isLogged(undefined)).toBe(false);
    expect(isLogged(log("2026-11-20"))).toBe(false);
  });

  it("counts any entry or submission as logged", () => {
    expect(isLogged(log("2026-11-20", { submitted: true }))).toBe(true);
    expect(isLogged(log("2026-11-20", { hydrationL: 0.5 }))).toBe(true);
    expect(isLogged(log("2026-11-20", { gyr: "green" }))).toBe(true);
  });
});

describe("dayPoints", () => {
  it("gives empty points for days that were not logged", () => {
    const pts = dayPoints({}, "2026-11-20", "2026-11-21");
    expect(pts).toHaveLength(2);
    expect(pts.every((p) => !p.logged && p.intake === null)).toBe(true);
  });

  it("reads intake, burn and hydration for a logged day", () => {
    const logs = { "2026-11-20": log("2026-11-20", { submitted: true, expenditure: 300, hydrationL: 2, meals: [{ id: "m", bucket: "Lunch", items: [food(600)] }] }) };
    const [p] = dayPoints(logs, "2026-11-20", "2026-11-20");
    expect(p).toMatchObject({ logged: true, intake: 600, expenditure: 300, hydration: 2 });
  });

  it("records a full fast as zero intake and 24 fasting hours", () => {
    const logs = { "2026-11-20": log("2026-11-20", { submitted: true, fasted: true }) };
    const [p] = dayPoints(logs, "2026-11-20", "2026-11-20");
    expect(p).toMatchObject({ intake: 0, fasting: 24, eating: 0, fasted: true });
  });
});

describe("summarize", () => {
  it("averages only over logged days", () => {
    const logs = {
      "2026-11-20": log("2026-11-20", { submitted: true, hydrationL: 2, meals: [{ id: "a", bucket: "Lunch", items: [food(1000)] }] }),
      "2026-11-21": log("2026-11-21", { submitted: true, hydrationL: 3, meals: [{ id: "b", bucket: "Lunch", items: [food(2000)] }] }),
      "2026-11-22": log("2026-11-22"),
    };
    const s = summarize(dayPoints(logs, "2026-11-20", "2026-11-22"));
    expect(s.days).toBe(2);
    expect(s.avgHydration).toBeCloseTo(2.5, 9);
  });

  it("counts Green, Yellow and Red days", () => {
    const logs = {
      "2026-11-20": log("2026-11-20", { submitted: true, gyr: "green" }),
      "2026-11-21": log("2026-11-21", { submitted: true, gyr: "red" }),
    };
    const s = summarize(dayPoints(logs, "2026-11-20", "2026-11-21"));
    expect(s).toMatchObject({ days: 2 });
  });

  it("returns empty averages when nothing is logged", () => {
    const s = summarize(dayPoints({}, "2026-11-20", "2026-11-21"));
    expect(s.days).toBe(0);
  });
});

describe("extraInsights", () => {
  it("returns a list for any set of points", () => {
    const logs = { "2026-11-20": log("2026-11-20", { submitted: true, meals: [{ id: "a", bucket: "Lunch", items: [food(1500)] }] }) };
    expect(Array.isArray(extraInsights(dayPoints(logs, "2026-11-20", "2026-11-20"), fullProfile))).toBe(true);
  });
});

describe("aggregateNutrients", () => {
  it("totals a nutrient across the window and reports its average per day", () => {
    const logs = {
      "2026-11-20": log("2026-11-20", { submitted: true, meals: [{ id: "a", bucket: "Lunch", items: [food(500, { protein_g: 30 })] }] }),
      "2026-11-21": log("2026-11-21", { submitted: true, meals: [{ id: "b", bucket: "Lunch", items: [food(500, { protein_g: 10 })] }] }),
    };
    const aggs = aggregateNutrients(logs, "2026-11-20", "2026-11-21", fullProfile);
    const protein = aggs.find((a) => a.key === "protein_g");
    expect(protein).toBeDefined();
    expect(protein!.avg).toBeCloseTo(20, 9);
    expect(protein!.days).toBe(2);
  });
});

describe("nutrientStatus", () => {
  it("treats a nutrient to get more of as good from 90% of the need", () => {
    expect(nutrientStatus(false, 0.95)).toBe("good");
    expect(nutrientStatus(false, 0.7)).toBe("warn");
    expect(nutrientStatus(false, 0.3)).toBe("bad");
  });

  it("treats a limit as good up to 100%, warn up to 120%, then bad", () => {
    expect(nutrientStatus(true, 1)).toBe("good");
    expect(nutrientStatus(true, 1.1)).toBe("warn");
    expect(nutrientStatus(true, 1.5)).toBe("bad");
  });
});

describe("dietaryInsights", () => {
  it("says a low nutrient is low and suggests a food", () => {
    const aggs = [{ key: "fiber_g", avg: 5, rda: 30, days: 3, daysOver: 0 }] as never;
    const [insight] = dietaryInsights(aggs);
    expect(insight.title).toContain("low");
    expect(insight.tone).toBe("bad");
    expect(insight.tip).toBeTruthy();
  });

  it("says a limit has been exceeded on how many days", () => {
    const aggs = [{ key: "sugar_g", avg: 60, rda: 30, days: 4, daysOver: 3 }] as never;
    const [insight] = dietaryInsights(aggs);
    expect(insight.text).toContain("3 of 4");
  });

  it("skips nutrients with no days or no target", () => {
    expect(dietaryInsights([{ key: "fiber_g", avg: 5, rda: 0, days: 3, daysOver: 0 }] as never)).toEqual([]);
    expect(dietaryInsights([{ key: "fiber_g", avg: 5, rda: 30, days: 0, daysOver: 0 }] as never)).toEqual([]);
  });
});
