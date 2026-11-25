// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "../../src/lib/store";
import type { CookedBatch, FoodItem } from "../../src/lib/types";

const TODAY = "2026-11-25";

const food = (over: Partial<FoodItem> = {}): FoodItem => ({
  name: "Rice",
  quantity: "100 g",
  calories: 130,
  macros: { protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 },
  micros: {},
  ...over,
});

const batch = (over: Partial<CookedBatch> = {}): CookedBatch => {
  const ingredients = [food({ name: "Rice", calories: 1000, quantity: "500 g" })];
  return {
    id: "b1",
    name: "Biryani",
    createdAt: "2026-11-20T10:00:00.000Z",
    cookedWeightG: 1000,
    servings: 4,
    ingredients,
    total: food({ name: "Biryani", quantity: "whole batch", calories: 1000, macros: { protein_g: 27, carbs_g: 280, fat_g: 3, fiber_g: 4 } }),
    remaining: 1,
    ...over,
  };
};

beforeEach(() => {
  // No signed-in user: every action stays local, so nothing reaches Supabase.
  useStore.setState({ logs: {}, batches: [], userId: null, syncError: null, deletedBatchIds: [], syncedBatchIds: [] });
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 25, 12, 0, 0)); // 25 Nov 2026, 12:00 local
});

afterEach(() => {
  vi.useRealTimers();
});

describe("store: meals", () => {
  it("adds a meal to the day and marks the day as not yet submitted", () => {
    const s = useStore.getState();
    s.addMeal(TODAY, "Lunch", [food()]);
    const log = useStore.getState().logs[TODAY];
    expect(log.meals).toHaveLength(1);
    expect(log.meals[0]).toMatchObject({ bucket: "Lunch", items: [expect.objectContaining({ name: "Rice" })] });
    expect(log.submitted).toBe(false);
  });

  it("clocks in 30 minutes before the first meal of today", () => {
    useStore.getState().addMeal(TODAY, "Breakfast", [food()]);
    const clockIn = new Date(useStore.getState().logs[TODAY].firstMealAt as string).getTime();
    expect(clockIn).toBe(new Date(2026, 10, 25, 11, 30, 0).getTime());
  });

  it("does not clock in automatically for a past day", () => {
    useStore.getState().addMeal("2026-11-01", "Lunch", [food()]);
    expect(useStore.getState().logs["2026-11-01"].firstMealAt).toBeNull();
  });

  it("does not move an existing clock-in when another meal is added", () => {
    useStore.getState().addMeal(TODAY, "Breakfast", [food()]);
    const first = useStore.getState().logs[TODAY].firstMealAt;
    vi.setSystemTime(new Date(2026, 10, 25, 13, 0, 0));
    useStore.getState().addMeal(TODAY, "Lunch", [food()]);
    expect(useStore.getState().logs[TODAY].firstMealAt).toBe(first);
  });

  it("changes a meal's bucket and items in place", () => {
    useStore.getState().addMeal(TODAY, "Lunch", [food()]);
    const id = useStore.getState().logs[TODAY].meals[0].id;
    useStore.getState().updateMeal(TODAY, id, "Dinner", [food({ name: "Dal", calories: 200 })]);
    const meal = useStore.getState().logs[TODAY].meals[0];
    expect(meal.bucket).toBe("Dinner");
    expect(meal.items[0].name).toBe("Dal");
  });

  it("removes only the meal that was asked for", () => {
    useStore.getState().addMeal(TODAY, "Breakfast", [food({ name: "Egg" })]);
    useStore.getState().addMeal(TODAY, "Lunch", [food({ name: "Rice" })]);
    const [egg, rice] = useStore.getState().logs[TODAY].meals;
    useStore.getState().removeMeal(TODAY, rice.id);
    const left = useStore.getState().logs[TODAY].meals;
    expect(left.map((m) => m.id)).toEqual([egg.id]);
    expect(left[0].items[0].name).toBe("Egg");
  });

  it("a full-day fast clears meals, marks the day fasted and submits it", () => {
    useStore.getState().addMeal(TODAY, "Lunch", [food()]);
    useStore.getState().setFastingDay(TODAY, true);
    const log = useStore.getState().logs[TODAY];
    expect(log).toMatchObject({ fasted: true, meals: [], gyr: "green", submitted: true, firstMealAt: null });
  });

  it("turning a fasting day off makes it editable again", () => {
    useStore.getState().setFastingDay(TODAY, true);
    useStore.getState().setFastingDay(TODAY, false);
    expect(useStore.getState().logs[TODAY]).toMatchObject({ fasted: false, submitted: false });
  });
});

describe("store: cooked batches", () => {
  it("adds a batch to the top of the list", () => {
    useStore.getState().addBatch(batch({ id: "old" }));
    useStore.getState().addBatch(batch({ id: "new" }));
    expect(useStore.getState().batches.map((b) => b.id)).toEqual(["new", "old"]);
  });

  it("uses up part of a batch", () => {
    useStore.getState().addBatch(batch());
    useStore.getState().consumeBatch("b1", 0.25);
    expect(useStore.getState().batches[0].remaining).toBe(0.75);
  });

  it("removes a batch once nothing is left", () => {
    useStore.getState().addBatch(batch({ remaining: 0.5 }));
    useStore.getState().consumeBatch("b1", 0.5);
    expect(useStore.getState().batches).toEqual([]);
    expect(useStore.getState().deletedBatchIds).toContain("b1");
  });

  it("rescales every logged portion when the batch is edited", () => {
    useStore.getState().addBatch(batch());
    // A logged meal that is a half share of the batch.
    useStore.getState().addMeal(TODAY, "Dinner", [food({ name: "Biryani (portion)", calories: 500, batch: { id: "b1", fraction: 0.5 } })]);

    const newTotal = food({ name: "Biryani", calories: 2000, macros: { protein_g: 54, carbs_g: 560, fat_g: 6, fiber_g: 8 } });
    useStore.getState().updateBatch("b1", { name: "Biryani", cookedWeightG: 2000, servings: 8, ingredients: [newTotal] });

    const portion = useStore.getState().logs[TODAY].meals[0].items[0];
    expect(portion.calories).toBe(1000);
    expect(portion.batch).toEqual({ id: "b1", fraction: 0.5 });
    expect(useStore.getState().batches[0]).toMatchObject({ cookedWeightG: 2000, servings: 8 });
  });
});

describe("store: routine and profile", () => {
  it("adds, toggles and removes a routine item", () => {
    useStore.getState().addRoutineItem("Drink water");
    const id = useStore.getState().routine[0].id;
    expect(useStore.getState().routine[0].text).toBe("Drink water");
    useStore.getState().toggleRoutineItem(id);
    expect(useStore.getState().routineChecks[id]).toBeTruthy();
    useStore.getState().removeRoutineItem(id);
    expect(useStore.getState().routine).toEqual([]);
  });

  it("sets the goal start date when a target weight is first set", () => {
    useStore.getState().setProfile({ targetWeightKg: 70 });
    expect(useStore.getState().goalSince).toBe(TODAY);
    expect(useStore.getState().profile.targetWeightKg).toBe(70);
  });
});
