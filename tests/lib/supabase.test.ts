import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Records every query the module makes, so tests can check the table, filter and payload it sends.
const h = vi.hoisted(() => ({
  createClient: vi.fn(),
  calls: [] as { table: string; method: string; args: unknown[] }[],
  result: { data: null as unknown, error: null as unknown },
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: h.createClient }));

function builder(table: string) {
  const proxy: unknown = new Proxy({}, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => Promise.resolve(h.result).then(resolve, reject);
      return (...args: unknown[]) => {
        h.calls.push({ table, method: String(prop), args });
        return proxy;
      };
    },
  });
  return proxy;
}

/** Loads a fresh copy of the module so the environment it reads at import time is the one the test sets. */
async function loadModule(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
  h.createClient.mockImplementation(() => ({ from: (table: string) => builder(table), auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({ error: null }) } }));
  return import("../../src/lib/supabase");
}

beforeEach(() => {
  h.calls = [];
  h.result = { data: null, error: null };
  h.createClient.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cloud sync not configured", () => {
  it("reports cloud sync as off and creates no client", async () => {
    const m = await loadModule({ NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined });
    expect(m.supabaseConfigured).toBe(false);
    expect(m.supabase).toBeNull();
    expect(h.createClient).not.toHaveBeenCalled();
  });

  it("refuses sign-in with a clear message", async () => {
    const m = await loadModule({ NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined });
    await expect(m.signInWithGoogle()).rejects.toThrow("Supabase is not configured");
  });

  it("does nothing on writes, so the app keeps working offline", async () => {
    const m = await loadModule({ NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined });
    await expect(m.pushRoutine("u", [])).resolves.toBeUndefined();
    await expect(m.pullRoutine("u")).resolves.toBeNull();
  });
});

describe("cloud sync configured", () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" };

  it("creates a client from the public URL and key", async () => {
    const m = await loadModule(env);
    expect(m.supabaseConfigured).toBe(true);
    expect(h.createClient).toHaveBeenCalledWith("https://example.supabase.co", "anon");
  });

  it("saves the routine for this user", async () => {
    const m = await loadModule(env);
    await m.pushRoutine("user-1", [{ id: "r1", text: "Walk", order: 0 } as never]);
    const upsert = h.calls.find((c) => c.method === "upsert")!;
    expect(upsert.table).toBe("user_content");
    expect(upsert.args[0]).toMatchObject({ user_id: "user-1", routine: [{ id: "r1", text: "Walk", order: 0 }] });
  });

  it("returns null when this account has never saved a routine", async () => {
    const m = await loadModule(env);
    h.result = { data: null, error: null };
    expect(await m.pullRoutine("user-1")).toBeNull();
  });

  it("returns the saved routine when one exists", async () => {
    const m = await loadModule(env);
    h.result = { data: { routine: [{ id: "r1", text: "Walk" }] }, error: null };
    expect(await m.pullRoutine("user-1")).toEqual([{ id: "r1", text: "Walk" }]);
  });

  it("throws the database error so the app can show it", async () => {
    const m = await loadModule(env);
    h.result = { data: null, error: { message: "permission denied" } };
    await expect(m.pullRoutine("user-1")).rejects.toMatchObject({ message: "permission denied" });
  });

  it("saves the profile to the users_profile table", async () => {
    const m = await loadModule(env);
    await m.pushProfile("user-1", { dob: "1990-01-01", gender: "male", heightCm: 175, weightKg: 80, activity: "sedentary", unitSystem: "metric", expenditureGoal: 0, hydrationGoalL: 2.5, fastingGoalH: 16, targetWeightKg: 75 } as never, { theme: "light", palette: "emerald" });
    const upsert = h.calls.find((c) => c.method === "upsert")!;
    expect(upsert.table).toBe("users_profile");
    expect(upsert.args[0]).toMatchObject({ user_id: "user-1", height_cm: 175, target_weight_kg: 75, prefs: { theme: "light", palette: "emerald" } });
  });

  it("maps a sync message for a missing table to the setup instruction", async () => {
    const m = await loadModule(env);
    expect(m.syncMessage({ message: "relation \"daily_logs\" does not exist" })).toContain("supabase/schema.sql");
    expect(m.syncMessage({ code: "PGRST205", message: "x" })).toContain("supabase/schema.sql");
    expect(m.syncMessage({ message: "Network down" })).toBe("Network down");
    expect(m.syncMessage(null)).toBe("Sync failed");
  });
});
