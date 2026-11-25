// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Scripted stand-in for the Supabase client. Each test sets what the next query should return.
const h = vi.hoisted(() => ({
  result: { data: null as unknown, error: null as unknown },
  calls: [] as { method: string; args: unknown[] }[],
  session: null as { access_token: string } | null,
  client: null as unknown,
}));

vi.mock("../../src/lib/supabase", () => ({
  get supabase() {
    return h.client;
  },
}));

import { claimPending, discardPending, enqueuePending, isRetryable, listPending, notifyPendingChanged, PENDING_CHANGED, processPending, retryPending } from "../../src/lib/pendingMeals";

function builder() {
  const proxy: unknown = new Proxy({}, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => Promise.resolve(h.result).then(resolve, reject);
      return (...args: unknown[]) => {
        h.calls.push({ method: String(prop), args });
        return proxy;
      };
    },
  });
  return proxy;
}

beforeEach(() => {
  h.result = { data: [], error: null };
  h.calls = [];
  h.session = null;
  h.client = {
    from: () => builder(),
    auth: { getSession: async () => ({ data: { session: h.session } }) },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isRetryable", () => {
  it("is true only for errors marked retryable", () => {
    expect(isRetryable(Object.assign(new Error("offline"), { retryable: true }))).toBe(true);
    expect(isRetryable(new Error("bad food"))).toBe(false);
    expect(isRetryable(null)).toBe(false);
  });
});

describe("pending change notifications", () => {
  it("fires the change event on the window", () => {
    const seen = vi.fn();
    window.addEventListener(PENDING_CHANGED, seen);
    notifyPendingChanged();
    expect(seen).toHaveBeenCalledTimes(1);
    window.removeEventListener(PENDING_CHANGED, seen);
  });
});

describe("listPending", () => {
  it("reads this user's queued meals in order", async () => {
    h.result = {
      data: [{ id: "p1", created_at: "2026-11-25T10:00:00Z", log_date: "2026-11-25", hour: 9, text: "idli", attempts: 1, last_error: null, status: "waiting", result: null }],
      error: null,
    };
    const list = await listPending("user-1");
    expect(list).toEqual([{ id: "p1", createdAt: "2026-11-25T10:00:00Z", logDate: "2026-11-25", hour: 9, text: "idli", attempts: 1, lastError: null, status: "waiting", result: null }]);
    expect(h.calls).toContainEqual({ method: "eq", args: ["user_id", "user-1"] });
  });

  it("throws when the query fails so the screen can show it", async () => {
    h.result = { data: null, error: { message: "permission denied" } };
    await expect(listPending("user-1")).rejects.toMatchObject({ message: "permission denied" });
  });
});

describe("enqueuePending", () => {
  it("saves a meal with its text, day and hour, ready for the server to retry", async () => {
    const ok = await enqueuePending("user-1", { text: "rice", logDate: "2026-11-25", hour: 13 });
    expect(ok).toBe(true);
    const insert = h.calls.find((c) => c.method === "insert")!.args[0] as Record<string, unknown>;
    expect(insert).toMatchObject({ user_id: "user-1", log_date: "2026-11-25", hour: 13, text: "rice", status: "waiting", attempts: 1 });
  });

  it("returns false when the database rejects the save", async () => {
    h.result = { data: null, error: { message: "down" } };
    expect(await enqueuePending("user-1", { text: "rice", logDate: "2026-11-25", hour: 13 })).toBe(false);
  });

  it("returns false instead of throwing when the cloud is not configured", async () => {
    h.client = null;
    expect(await enqueuePending("user-1", { text: "rice", logDate: "2026-11-25", hour: 13 })).toBe(false);
  });
});

describe("claimPending and discardPending", () => {
  it("claims an entry only if this device was first", async () => {
    h.result = { data: [{ id: "p1" }], error: null };
    expect(await claimPending("p1")).toBe(true);
    h.result = { data: [], error: null };
    expect(await claimPending("p1")).toBe(false);
  });

  it("discards an entry by deleting it", async () => {
    await discardPending("p1");
    expect(h.calls.map((c) => c.method)).toEqual(["delete", "eq"]);
  });

  it("throws when the claim fails", async () => {
    h.result = { data: null, error: { message: "boom" } };
    await expect(claimPending("p1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("retryPending", () => {
  it("puts a failed entry back in the queue to be tried now", async () => {
    await retryPending("p1");
    const update = h.calls.find((c) => c.method === "update")!.args[0] as Record<string, unknown>;
    expect(update).toMatchObject({ status: "waiting", attempts: 0, last_error: null });
  });
});

describe("processPending", () => {
  it("does nothing without a signed-in session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await processPending();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the server to retry, with the user's token", async () => {
    h.session = { access_token: "tok" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await processPending();
    expect(fetchMock).toHaveBeenCalledWith("/api/pending", expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer tok" } }));
  });

  it("never fails the caller when the network is down", async () => {
    h.session = { access_token: "tok" };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(processPending()).resolves.toBeUndefined();
  });
});
