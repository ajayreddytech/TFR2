import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The route builds its own Supabase client, so each test scripts what every query returns.
const h = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  /** Results for each db.from(...) call, in order. */
  results: [] as { data: unknown; error: unknown }[],
  /** Every builder method call, with the table name. */
  calls: [] as { table: string; method: string; args: unknown[] }[],
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: h.createClient }));

import { POST } from "../../src/app/api/pending/route";

/** A chainable stand-in for the Supabase query builder. Awaiting it yields the next scripted result. */
function builder(table: string, result: { data: unknown; error: unknown }) {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => Promise.resolve(result).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          h.calls.push({ table, method: String(prop), args });
          return proxy;
        };
      },
    },
  );
  return proxy;
}

const fromCalls = (table: string) => h.calls.filter((c) => c.table === table);

let fetchMock: ReturnType<typeof vi.fn>;

const pendingRow = (over: Record<string, unknown> = {}) => ({
  id: "row-1",
  attempts: 0,
  log_date: "2026-11-25",
  hour: 13,
  text: "rice for lunch",
  audio_mime: null,
  audio_b64: null,
  batches: [],
  ...over,
});

/** Scripts the usual sequence for one due row: the list query, the claim, then the final update. */
function scriptOneRow(row = pendingRow()) {
  h.results.push({ data: [row], error: null }, { data: [{ id: row.id }], error: null }, { data: null, error: null });
}

const retryRequest = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/pending", { method: "POST", headers });

/** What the app sends: the signed-in user's token. */
const SIGNED_IN = { authorization: "Bearer good" };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  h.results = [];
  h.calls = [];
  h.getUser.mockReset();
  h.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  h.createClient.mockReset();
  h.createClient.mockImplementation(() => ({
    auth: { getUser: h.getUser },
    from: (table: string) => builder(table, h.results.shift() ?? { data: null, error: null }),
  }));
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("POST /api/pending: access", () => {
  it("returns 503 when the server is not configured for retries", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(retryRequest({ authorization: "Bearer t" }));
    expect(res.status).toBe(503);
  });

  it("returns 401 when no sign-in token is sent", async () => {
    const res = await POST(retryRequest());
    expect(res.status).toBe(401);
    expect(h.getUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the sign-in token is rejected", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad token" } });
    const res = await POST(retryRequest({ authorization: "Bearer bad" }));
    expect(res.status).toBe(401);
  });

});

describe("POST /api/pending: processing", () => {
  it("only processes the signed-in user's entries when called from the app", async () => {
    h.getUser.mockResolvedValue({ data: { user: { id: "user-42" } }, error: null });
    h.results.push({ data: [], error: null });
    const res = await POST(retryRequest({ authorization: "Bearer good" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 0 });
    expect(h.calls).toContainEqual({ table: "pending_meals", method: "eq", args: ["user_id", "user-42"] });
  });

  it("saves the reply and clears the audio once the AI answers", async () => {
    scriptOneRow();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ kind: "meal", items: [] }) });
    const res = await POST(retryRequest(SIGNED_IN));
    expect(await res.json()).toEqual({ processed: 1 });
    const finalUpdate = h.calls.filter((c) => c.method === "update").at(-1);
    expect(finalUpdate?.args[0]).toMatchObject({ status: "ready", audio_b64: null, last_error: null, attempts: 1 });
  });

  it("sends the saved text, meal hour and day to the parser", async () => {
    scriptOneRow(pendingRow({ text: "rice", hour: 8, log_date: "2026-11-20" }));
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ kind: "meal" }) });
    await POST(retryRequest(SIGNED_IN));
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost/api/parse-food");
    expect(sent).toMatchObject({ text: "rice", hour: 8, today: "2026-11-20", mode: "meal" });
  });

  it("puts a busy AI service back in the queue with a later retry time", async () => {
    scriptOneRow();
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "busy" }) });
    await POST(retryRequest(SIGNED_IN));
    const finalUpdate = h.calls.filter((c) => c.method === "update").at(-1)?.args[0] as Record<string, unknown>;
    expect(finalUpdate.status).toBe("waiting");
    expect(finalUpdate.attempts).toBe(1);
    expect(finalUpdate.last_error).toBe("busy");
    expect(new Date(finalUpdate.next_try_at as string).getTime()).toBeGreaterThan(Date.now());
  });

  it("marks a rejected request as failed instead of retrying it forever", async () => {
    scriptOneRow();
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "Bad request" }) });
    await POST(retryRequest(SIGNED_IN));
    const finalUpdate = h.calls.filter((c) => c.method === "update").at(-1)?.args[0] as Record<string, unknown>;
    expect(finalUpdate).toMatchObject({ status: "failed", last_error: "Bad request", next_try_at: null });
  });

  it("keeps the entry waiting when the AI service cannot be reached", async () => {
    scriptOneRow();
    fetchMock.mockRejectedValue(new Error("offline"));
    await POST(retryRequest(SIGNED_IN));
    const finalUpdate = h.calls.filter((c) => c.method === "update").at(-1)?.args[0] as Record<string, unknown>;
    expect(finalUpdate).toMatchObject({ status: "waiting", last_error: "Could not reach the AI service." });
  });

  it("skips an entry another process has already claimed", async () => {
    h.results.push({ data: [pendingRow()], error: null }, { data: [], error: null });
    const res = await POST(retryRequest(SIGNED_IN));
    expect(await res.json()).toEqual({ processed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
