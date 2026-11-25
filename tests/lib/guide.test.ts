import { describe, expect, it } from "vitest";
import { FAQS, GUIDE_SECTIONS, PROPORTIONS, RECIPE_CATEGORIES, RECIPE_TIPS, TRY_IDEAS, VULNERABLES, WEEK_PLAN } from "../../src/lib/guide";

describe("recipe categories", () => {
  it("has unique ids and at least one idea per category", () => {
    const ids = RECIPE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of RECIPE_CATEGORIES) expect(c.items.length, c.id).toBeGreaterThan(0);
  });

  it("gives every category a title and emoji", () => {
    for (const c of RECIPE_CATEGORIES) {
      expect(c.title.trim()).not.toBe("");
      expect(c.emoji.trim()).not.toBe("");
    }
  });
});

describe("guide content", () => {
  it("has unique section ids, each with points", () => {
    const ids = GUIDE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of GUIDE_SECTIONS) expect(s.points.length, s.id).toBeGreaterThan(0);
  });

  it("includes the safe-practices section", () => {
    expect(GUIDE_SECTIONS.some((s) => /safe/i.test(s.title))).toBe(true);
  });

  it("has non-empty proportions, week plan, tips and try ideas", () => {
    expect(PROPORTIONS.length).toBeGreaterThan(0);
    expect(WEEK_PLAN.trim()).not.toBe("");
    expect(RECIPE_TIPS.length).toBeGreaterThan(0);
    expect(TRY_IDEAS.length).toBeGreaterThan(0);
    expect(VULNERABLES.length).toBeGreaterThan(0);
  });
});

describe("FAQs", () => {
  it("gives every question an answer", () => {
    expect(FAQS.length).toBeGreaterThan(0);
    for (const f of FAQS) {
      expect(f.q.trim()).not.toBe("");
      expect(f.a.trim()).not.toBe("");
    }
  });
});
