import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/parse-food/route";
import { MACRO_KEYS, MICRO_KEYS } from "../../src/lib/nutrients";

const URL_BASE = "http://localhost/api/parse-food";

const zeros = (keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, 0]));

/** A model reply, wrapped the way Gemini returns it. */
const geminiReply = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

const req = (body: unknown, raw = false) =>
  new Request(URL_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });

const riceItem = (over: Record<string, unknown> = {}) => ({
  name: "Rice",
  quantity: "200 g",
  calories: 260,
  macros: { protein_g: 5, carbs_g: 56, fat_g: 0.6, fiber_g: 0.6 },
  micros: {},
  ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_FALLBACK_MODELS;
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
});

describe("POST /api/parse-food: input validation", () => {
  it("returns 503 when the server has no Gemini key", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(req("not json", true));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON body.");
  });

  it("returns 400 when there is neither text nor audio", async () => {
    const res = await POST(req({ text: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the text is over 2000 characters", async () => {
    const res = await POST(req({ text: "a".repeat(2001) }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 413 when the recording is too large", async () => {
    const res = await POST(req({ audio: { mimeType: "audio/wav", data: "A".repeat(6_000_001) } }));
    expect(res.status).toBe(413);
  });

  it("returns 400 for an audio type that is not audio/*", async () => {
    const res = await POST(req({ audio: { mimeType: "text/html", data: "AAAA" } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unsupported audio type.");
  });

  it("returns 400 in correct mode when there is nothing to correct", async () => {
    const res = await POST(req({ text: "make it 2 eggs", mode: "correct" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/parse-food: meal parsing", () => {
  it("parses a meal into the named bucket with sanitized nutrition", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({ kind: "meal", transcript: "rice for lunch", target_bucket: "Lunch", items: [riceItem()] })),
    );
    const res = await POST(req({ text: "rice for lunch", hour: 13, today: "2026-11-25" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Meal mode always answers in the "meals" shape: one group per bucket.
    expect(body.kind).toBe("meals");
    expect(body.transcript).toBe("rice for lunch");
    expect(body.meals).toHaveLength(1);
    expect(body.meals[0].target_bucket).toBe("Lunch");
    const item = body.meals[0].items[0];
    expect(item.calories).toBe(260);
    // Every nutrient key is present so the client can rely on the shape.
    expect(Object.keys(item.macros).sort()).toEqual([...MACRO_KEYS].sort());
    expect(Object.keys(item.micros).sort()).toEqual([...MICRO_KEYS].sort());
  });

  it("clamps negative and non-numeric nutrition to 0", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({ kind: "meal", target_bucket: "Dinner", items: [riceItem({ calories: -50, macros: { protein_g: "lots" } })] })),
    );
    const body = await (await POST(req({ text: "rice" }))).json();
    expect(body.meals[0].items[0].calories).toBe(0);
    expect(body.meals[0].items[0].macros.protein_g).toBe(0);
  });

  it("accepts a reply wrapped in a ```json code fence", async () => {
    const json = JSON.stringify({ kind: "meal", target_bucket: "Breakfast", items: [riceItem()] });
    fetchMock.mockResolvedValueOnce(geminiReply("```json\n" + json + "\n```"));
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(200);
    expect((await res.json()).meals[0].target_bucket).toBe("Breakfast");
  });

  it("returns 422 when no food was recognised", async () => {
    fetchMock.mockResolvedValueOnce(geminiReply(JSON.stringify({ kind: "meal", transcript: "hello", target_bucket: "Lunch", items: [] })));
    const res = await POST(req({ text: "hello" }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("hello");
  });

  it("splits a multi-meal reply into one group per bucket and merges duplicates", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({
        kind: "meals",
        transcript: "breakfast eggs, lunch rice, breakfast toast",
        meals: [
          { target_bucket: "Breakfast", items: [riceItem({ name: "Egg" })] },
          { target_bucket: "Lunch", items: [riceItem({ name: "Rice" })] },
          { target_bucket: "Breakfast", items: [riceItem({ name: "Toast" })] },
        ],
      })),
    );
    const body = await (await POST(req({ text: "x", mode: "meal" }))).json();
    expect(body.kind).toBe("meals");
    expect(body.meals).toHaveLength(2);
    const breakfast = body.meals.find((m: { target_bucket: string }) => m.target_bucket === "Breakfast");
    expect(breakfast.items.map((i: { name: string }) => i.name)).toEqual(["Egg", "Toast"]);
  });
});

describe("POST /api/parse-food: model calls", () => {
  it("tries the primary model first, then the fallback", async () => {
    fetchMock.mockResolvedValueOnce(geminiReply(JSON.stringify({ kind: "meal", target_bucket: "Lunch", items: [riceItem()] })));
    await POST(req({ text: "rice" }));
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("models/gemini-3.1-flash-lite:generateContent");
  });

  it("falls back to the next model when the primary returns 404", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce(geminiReply(JSON.stringify({ kind: "meal", target_bucket: "Lunch", items: [riceItem()] })));
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[1][0])).toContain("gemini-3.5-flash-lite");
  });

  it("returns 502 with the upstream status when every model fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400 });
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Gemini request failed (400).");
  });

  it("returns 504 when the model call times out or cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(504);
  });

  it("returns 502 when the model keeps replying with something that is not JSON", async () => {
    fetchMock.mockResolvedValue(geminiReply("I cannot help with that"));
    const res = await POST(req({ text: "rice" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Could not understand the AI response. Please try again.");
    // One retry with a fresh call before giving up.
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("POST /api/parse-food: correction mode", () => {
  it("returns 422 when the model reports no change", async () => {
    fetchMock.mockResolvedValueOnce(geminiReply(JSON.stringify({ kind: "correction", transcript: "looks fine" })));
    const res = await POST(req({ text: "looks fine", mode: "correct", current: { blocks: [] } }));
    expect(res.status).toBe(422);
  });

  it("returns the requested row updates and removals", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({
        kind: "correction",
        transcript: "make the rice 300 grams",
        update: [{ block: 0, index: 0, item: riceItem({ quantity: "300 g", calories: 390 }) }],
        remove: [{ block: 0, index: 1 }],
      })),
    );
    const res = await POST(req({ text: "make the rice 300 grams", mode: "correct", current: { blocks: [{ bucket: "Lunch", items: [] }] } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("correction");
    expect(body.update).toEqual([{ block: 0, index: 0, item: expect.objectContaining({ calories: 390, quantity: "300 g" }) }]);
    expect(body.remove).toEqual([{ block: 0, index: 1 }]);
  });

  it("drops update rows that lack a valid block index", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({ kind: "correction", update: [{ block: -1, index: 0, item: riceItem() }], remove: [{ block: "x", index: 0 }] })),
    );
    const res = await POST(req({ text: "change it", mode: "correct", current: { blocks: [] } }));
    expect(res.status).toBe(422);
  });
});

describe("POST /api/parse-food: auto mode", () => {
  it("returns a plan when the model says the user is describing a future day", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({ kind: "plan", transcript: "tomorrow lunch is rice", target_date: "2026-11-26", meals: [{ target_bucket: "Lunch", items: [riceItem()] }] })),
    );
    const body = await (await POST(req({ text: "tomorrow lunch is rice", mode: "auto", today: "2026-11-25" }))).json();
    expect(body.kind).toBe("plan");
    expect(body.target_date).toBe("2026-11-26");
  });

  it("returns cooking ingredients as a cook draft", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiReply(JSON.stringify({ kind: "cook", name: "Dal", cooked_weight_g: 900, servings: 3, items: [riceItem({ name: "Lentils" })] })),
    );
    const body = await (await POST(req({ text: "cooked dal with 200g lentils", mode: "auto" }))).json();
    expect(body.kind).toBe("cook");
    expect(body.name).toBe("Dal");
    expect(body.cooked_weight_g).toBe(900);
    expect(body.servings).toBe(3);
  });
});
