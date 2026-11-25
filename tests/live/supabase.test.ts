import { describe, expect, it } from "vitest";
import { has, localEnv } from "../helpers/env";

const TABLES = ["users_profile", "daily_logs", "meal_entries", "weight_logs", "cooked_batches", "user_content", "daily_drafts"];

// Talks to the real Supabase project. Skipped unless the URL and anon key are in .env.local.
describe.skipIf(!has("NEXT_PUBLIC_SUPABASE_URL") || !has("NEXT_PUBLIC_SUPABASE_ANON_KEY"))("live: Supabase project", () => {
  const url = localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anon = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const headers = { apikey: anon, Authorization: `Bearer ${anon}` };

  it("is reachable over HTTPS", async () => {
    const res = await fetch(`${url}/rest/v1/`, { headers });
    expect(res.status).toBeLessThan(500);
  });

  it.each(TABLES)("has the %s table from supabase/schema.sql", async (table) => {
    // A missing table answers 404 with PGRST205; an existing one answers 200 (possibly with no rows).
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, { headers });
    expect(res.status, `${table} should exist`).toBe(200);
  });
});
