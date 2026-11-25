import { describe, expect, it } from "vitest";
import { BUCKET_TIMES, MEAL_BUCKETS } from "../../src/lib/types";

describe("meal buckets", () => {
  it("lists each bucket once, in day order", () => {
    expect(new Set(MEAL_BUCKETS).size).toBe(MEAL_BUCKETS.length);
    expect(MEAL_BUCKETS[0]).toBe("Pre 8:30 a.m.");
    expect(MEAL_BUCKETS[MEAL_BUCKETS.length - 1]).toBe("Post 6:30 p.m.");
  });

  it("gives every bucket a time window", () => {
    for (const b of MEAL_BUCKETS) {
      expect(BUCKET_TIMES[b], b).toBeTruthy();
    }
  });

  it("only has time windows for buckets that exist", () => {
    expect(Object.keys(BUCKET_TIMES).sort()).toEqual([...MEAL_BUCKETS].sort());
  });
});
