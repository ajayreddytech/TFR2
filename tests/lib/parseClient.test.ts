// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guessBucket, parseInput, portionItem, toParseResult } from "../../src/lib/parseClient";
import { useStore } from "../../src/lib/store";
import type { CookedBatch, FoodItem } from "../../src/lib/types";

const food = (over: Partial<FoodItem> = {}): FoodItem => ({
  name: "Rice",
  quantity: "100 g",
  calories: 130,
  macros: { protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 },
  micros: {},
  ...over,
});

const at = (h: number, m = 0) => new Date(2026, 10, 25, h, m, 0);

const batch: CookedBatch = {
  id: "b1",
  name: "Dal",
  createdAt: "2026-11-20T10:00:00.000Z",
  cookedWeightG: 900,
  servings: 3,
  ingredients: [food({ name: "Lentils", calories: 300 }), food({ name: "Oil", calories: 120 })],
  total: food({ name: "Dal", quantity: "whole batch", calories: 420, macros: { protein_g: 30, carbs_g: 60, fat_g: 8, fiber_g: 12 } }),
  remaining: 1,
};

beforeEach(() => {
  useStore.setState({ batches: [batch], userId: null, logs: {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("guessBucket", () => {
  it("picks the meal bucket for the time of day", () => {
    expect(guessBucket(at(7))).toBe("Pre 8:30 a.m.");
    expect(guessBucket(at(9))).toBe("Breakfast");
    expect(guessBucket(at(11))).toBe("Morning Snack");
    expect(guessBucket(at(13))).toBe("Lunch");
    expect(guessBucket(at(16))).toBe("Evening Snack");
    expect(guessBucket(at(18))).toBe("Dinner");
    expect(guessBucket(at(20))).toBe("Post 6:30 p.m.");
  });
});

describe("toParseResult", () => {
  it("turns a single meal reply into a meal, using the time when no bucket was named", () => {
    const r = toParseResult({ kind: "meal", transcript: "rice", target_bucket: null, items: [food()] }, at(13));
    expect(r).toEqual({ kind: "meal", parsed: { target_bucket: "Lunch", items: [expect.objectContaining({ name: "Rice" })], transcript: "rice" } });
  });

  it("keeps the named bucket over the clock", () => {
    const r = toParseResult({ kind: "meal", target_bucket: "Dinner", items: [food()] }, at(9));
    expect(r.kind === "meal" && r.parsed.target_bucket).toBe("Dinner");
  });

  it("gives each meal in a multi-meal reply its own bucket, with the transcript", () => {
    const r = toParseResult({ kind: "meals", transcript: "t", meals: [{ target_bucket: "Lunch", items: [food()] }, { target_bucket: null, items: [food()] }] }, at(9));
    expect(r.kind).toBe("meals");
    if (r.kind === "meals") {
      expect(r.meals.map((m) => m.target_bucket)).toEqual(["Lunch", "Breakfast"]);
      expect(r.meals[0].transcript).toBe("t");
    }
  });

  it("returns a plan with its date", () => {
    const r = toParseResult({ kind: "plan", target_date: "2026-11-26", meals: [{ target_bucket: "Lunch", items: [food()] }] });
    expect(r).toMatchObject({ kind: "plan", date: "2026-11-26" });
  });

  it("returns a cook draft with its name and weight", () => {
    const r = toParseResult({ kind: "cook", transcript: "dal", name: "Dal", cooked_weight_g: 900, servings: 3, items: [food()] });
    expect(r).toMatchObject({ kind: "cook", draft: { name: "Dal", cookedWeightG: 900, servings: 3 } });
  });

  it("removes the named ingredients from an existing batch and adds the new ones", () => {
    const r = toParseResult({ kind: "cook_update", transcript: "forgot oil", batch_id: "b1", remove: ["oil"], add: [food({ name: "Ghee", calories: 50 })] });
    expect(r.kind).toBe("cook");
    if (r.kind === "cook") {
      expect(r.draft.items.map((i) => i.name)).toEqual(["Lentils", "Ghee"]);
      expect(r.draft.batchId).toBe("b1");
      expect(r.draft.name).toBe("Dal");
    }
  });

  it("throws when an update refers to a batch that no longer exists", () => {
    expect(() => toParseResult({ kind: "cook_update", batch_id: "gone", remove: [], add: [] })).toThrow("That cooked batch no longer exists.");
  });

  it("turns a portion of a batch into a meal item linked to that batch", () => {
    const r = toParseResult({ kind: "portion", target_bucket: "Lunch", batch_id: "b1", fraction: 0.5 });
    expect(r.kind).toBe("meal");
    if (r.kind === "meal") {
      expect(r.parsed.batch).toEqual({ id: "b1", fraction: 0.5 });
      expect(r.parsed.items[0].calories).toBe(210);
      expect(r.parsed.items[0].name).toBe("Dal (portion)");
    }
  });
});

describe("portionItem", () => {
  it("scales the batch total and describes the share and weight", () => {
    const p = portionItem("b1", 0.25);
    expect(p?.name).toBe("Dal");
    expect(p?.item.calories).toBe(105);
    expect(p?.item.quantity).toBe("25% of batch ≈ 225g");
  });

  it("returns null for an unknown batch", () => {
    expect(portionItem("nope", 0.5)).toBeNull();
  });
});

describe("parseInput", () => {
  it("sends the text, the local hour and the open batches to the parser", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ kind: "meal", target_bucket: "Lunch", items: [food()] }) });
    vi.stubGlobal("fetch", fetchMock);
    await parseInput({ text: "rice", mode: "meal" });
    const [url, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    expect(url).toBe("/api/parse-food");
    expect(sent).toMatchObject({ text: "rice", mode: "meal", batches: [{ id: "b1", name: "Dal", remaining: 1, ingredients: ["Lentils", "Oil"] }] });
    expect(typeof sent.hour).toBe("number");
  });

  it("reports a network failure as an offline message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(parseInput({ text: "rice", mode: "meal" })).rejects.toThrow(/offline/);
  });

  it("passes the server's message through for a 422", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: "No food items recognised." }) }));
    const err = await parseInput({ text: "hmm", mode: "meal" }).catch((e) => e);
    expect(err.message).toBe("No food items recognised.");
  });
});
