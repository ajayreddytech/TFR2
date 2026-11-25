// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useContent } from "../../src/lib/contentStore";
import { FAQS, RECIPE_CATEGORIES } from "../../src/lib/guide";

beforeEach(() => {
  // Recipes, guide and FAQs are edited locally here; nothing is signed in, so nothing is sent to the cloud.
  useContent.setState({ faqs: FAQS.map((f) => ({ ...f })), plans: {} } as never);
});

describe("useContent defaults", () => {
  it("starts with the built-in recipe categories and FAQs", () => {
    const s = useContent.getState();
    expect(s.recipes.map((c) => c.id)).toEqual(expect.arrayContaining(RECIPE_CATEGORIES.map((c) => c.id)));
    expect(s.faqs.length).toBe(FAQS.length);
  });
});

describe("FAQ editing", () => {
  it("adds a question and answer", () => {
    const before = useContent.getState().faqs.length;
    useContent.getState().addFaq("Missed my meal?", "Eat when you next feel hungry.");
    const faqs = useContent.getState().faqs;
    expect(faqs).toHaveLength(before + 1);
    expect(faqs[faqs.length - 1]).toMatchObject({ q: "Missed my meal?", a: "Eat when you next feel hungry." });
  });

  it("edits a question in place", () => {
    useContent.getState().editFaq(0, "New question", "New answer");
    expect(useContent.getState().faqs[0]).toMatchObject({ q: "New question", a: "New answer" });
  });

  it("removes a question", () => {
    const before = useContent.getState().faqs.length;
    useContent.getState().removeFaq(0);
    expect(useContent.getState().faqs).toHaveLength(before - 1);
  });
});

describe("recipe list editing", () => {
  it("adds an idea to a category", () => {
    const cat = RECIPE_CATEGORIES[0];
    useContent.getState().addItem("recipes", cat.id, "Test idea");
    const updated = useContent.getState().recipes.find((c) => c.id === cat.id)!;
    expect(updated.items).toContain("Test idea");
  });

  it("edits and removes an idea by position", () => {
    const cat = RECIPE_CATEGORIES[0];
    useContent.getState().editItem("recipes", cat.id, 0, "Changed");
    expect(useContent.getState().recipes.find((c) => c.id === cat.id)!.items[0]).toBe("Changed");
    const count = useContent.getState().recipes.find((c) => c.id === cat.id)!.items.length;
    useContent.getState().removeItem("recipes", cat.id, 0);
    expect(useContent.getState().recipes.find((c) => c.id === cat.id)!.items).toHaveLength(count - 1);
  });

  it("adds, renames and removes a category", () => {
    const id = useContent.getState().addModule("recipes", "Smoothies", "🥤");
    expect(useContent.getState().recipes.some((c) => c.id === id && c.title === "Smoothies")).toBe(true);
    useContent.getState().renameModule("recipes", id, "Shakes", "🥛");
    expect(useContent.getState().recipes.find((c) => c.id === id)).toMatchObject({ title: "Shakes", emoji: "🥛" });
    useContent.getState().removeModule("recipes", id);
    expect(useContent.getState().recipes.some((c) => c.id === id)).toBe(false);
  });
});

describe("meal plans", () => {
  it("adds and clears a plan for a day", () => {
    const items = [{ name: "Oats", quantity: "1 bowl", calories: 300, macros: { protein_g: 10, carbs_g: 50, fat_g: 5, fiber_g: 6 }, micros: {} }];
    useContent.getState().addPlan("2026-11-26", items as never);
    expect(useContent.getState().plans["2026-11-26"]).toEqual(items);
    useContent.getState().clearPlan("2026-11-26");
    expect(useContent.getState().plans["2026-11-26"]).toBeUndefined();
  });
});
