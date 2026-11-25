import { beforeAll, describe, expect, it } from "vitest";
import { has, localEnv } from "../helpers/env";

// Calls the real Gemini model through the app's own parse route. Skipped unless GEMINI_API_KEY is in .env.local.
describe.skipIf(!has("GEMINI_API_KEY"))("live: Gemini parsing", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = localEnv.GEMINI_API_KEY;
    if (localEnv.GEMINI_MODEL) process.env.GEMINI_MODEL = localEnv.GEMINI_MODEL;
    if (localEnv.GEMINI_FALLBACK_MODELS) process.env.GEMINI_FALLBACK_MODELS = localEnv.GEMINI_FALLBACK_MODELS;
    ({ POST } = await import("../../src/app/api/parse-food/route"));
  });

  const parse = (body: unknown) =>
    POST(new Request("http://localhost/api/parse-food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

  it("parses a simple meal into calories and a bucket", async () => {
    const res = await parse({ text: "one boiled egg for breakfast", hour: 8, today: "2026-11-25", mode: "meal" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("meals");
    const item = body.meals[0].items[0];
    expect(item.calories).toBeGreaterThan(40);
    expect(item.calories).toBeLessThan(200);
    expect(body.meals[0].target_bucket).toBe("Breakfast");
  }, 60_000);

  it("keeps every nutrient key in the reply, so the app can rely on the shape", async () => {
    const res = await parse({ text: "a glass of milk", hour: 9, today: "2026-11-25", mode: "meal" });
    const body = await res.json();
    expect(Object.keys(body.meals[0].items[0].macros)).toEqual(expect.arrayContaining(["protein_g", "carbs_g", "fat_g", "fiber_g"]));
  }, 60_000);

  it("plans a future day when the user describes tomorrow", async () => {
    const res = await parse({ text: "tomorrow lunch is dal and rice", hour: 20, today: "2026-11-25", mode: "plan" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("plan");
    expect(body.target_date).toBe("2026-11-26");
  }, 60_000);
});
