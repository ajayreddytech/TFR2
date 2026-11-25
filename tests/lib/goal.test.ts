import { describe, expect, it } from "vitest";
import { computeGoal } from "../../src/lib/goal";
import type { DailyLog, Profile, WeightLog } from "../../src/lib/types";
import { DEFAULT_PROFILE } from "../../src/lib/store";

const TODAY = "2026-11-25";

const profile = (over: Partial<Profile> = {}): Profile => ({
  ...DEFAULT_PROFILE,
  dob: "1990-01-01",
  gender: "male",
  heightCm: 175,
  weightKg: 80,
  activity: "sedentary",
  expenditureGoal: 0,
  ...over,
});

/** A submitted day with the given intake and burn. */
const day = (date: string, intake: number, expenditure = 0): DailyLog => ({
  date,
  meals: intake > 0 ? [{ id: date, bucket: "Lunch", items: [{ name: "Food", quantity: "1", calories: intake, macros: { protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }, micros: {} }] }] : [],
  expenditure,
  hydrationL: 0,
  gyr: null,
  nibbles: null,
  firstMealAt: null,
  lastMealAt: null,
  fasted: false,
  submitted: true,
});

describe("computeGoal", () => {
  it("returns nothing until a target weight is set", () => {
    expect(computeGoal({}, [], profile({ targetWeightKg: null }), null, TODAY)).toBeNull();
  });

  it("is in lose mode when the target is below the current weight", () => {
    const g = computeGoal({}, [], profile({ targetWeightKg: 75 }), "2026-11-01", TODAY);
    expect(g?.mode).toBe("lose");
    expect(g?.gapKcal).toBeCloseTo((75 - 80) * 7700, 6);
    expect(g?.baseKcal).toBeCloseTo(5 * 7700, 6);
    expect(g?.reached).toBe(false);
  });

  it("is in gain mode when the target is above the current weight", () => {
    const g = computeGoal({}, [], profile({ targetWeightKg: 85 }), "2026-11-01", TODAY);
    expect(g?.mode).toBe("gain");
  });

  it("holds when already at the target weight", () => {
    const g = computeGoal({}, [], profile({ targetWeightKg: 80 }), "2026-11-01", TODAY);
    expect(g?.mode).toBe("hold");
  });

  it("uses the latest weigh-in as the current weight", () => {
    const weights: WeightLog[] = [
      { date: "2026-11-10", weightKg: 79 },
      { date: "2026-11-20", weightKg: 77 },
    ];
    const g = computeGoal({}, weights, profile({ targetWeightKg: 75 }), "2026-11-01", TODAY);
    expect(g?.current).toBe(77);
    expect(g?.lastWeighIn).toBe("2026-11-20");
  });

  it("counts a deficit day as progress when losing weight", () => {
    // TDEE for this profile is about 1900 kcal; eating 900 burns far more than that.
    const logs = { "2026-11-20": day("2026-11-20", 900) };
    const g = computeGoal(logs, [], profile({ targetWeightKg: 75 }), "2026-11-20", TODAY);
    expect(g?.progressKcal).toBeGreaterThan(0);
    expect(g?.wrong).toBe(false);
    expect(g?.remainingKcal).toBeLessThan(g!.baseKcal);
  });

  it("flags progress moving away from the goal", () => {
    const logs = { "2026-11-20": day("2026-11-20", 4000) };
    const g = computeGoal(logs, [], profile({ targetWeightKg: 75 }), "2026-11-20", TODAY);
    expect(g?.progressKcal).toBeLessThan(0);
    expect(g?.wrong).toBe(true);
  });

  it("does not count today until the day is over, but shows it live", () => {
    const logs = { [TODAY]: day(TODAY, 900) };
    const g = computeGoal(logs, [], profile({ targetWeightKg: 75 }), "2026-11-20", TODAY);
    expect(g?.days.map((d) => d.date)).not.toContain(TODAY);
    expect(g?.liveDay?.date).toBe(TODAY);
  });

  // Known gap: the direction is worked out from the current weight, so a weight-loss goal that is overshot
  // flips into "gain" mode and is not reported as reached. it.fails passes while that is still the behaviour,
  // and will start failing (flagging this for removal) once the goal stores its starting direction.
  it.fails("KNOWN GAP: a weight-loss goal overshot below its target is not reported as reached", () => {
    const weights: WeightLog[] = [{ date: "2026-11-20", weightKg: 74.5 }];
    const g = computeGoal({}, weights, profile({ targetWeightKg: 75 }), "2026-11-01", TODAY);
    expect(g?.reached).toBe(true);
  });
});
