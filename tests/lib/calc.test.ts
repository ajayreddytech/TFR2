import { describe, expect, it } from "vitest";
import { bmiCategory, bmiClass, calcAge, calcBMI, dayFastingHours, fastingStats, kgToLb, lbToKg, round } from "../../src/lib/calc";

describe("unit conversions", () => {
  it("converts kg to lb and back", () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(kgToLb(72.5))).toBeCloseTo(72.5, 9);
  });
  it("rounds to a number of decimal places", () => {
    expect(round(2.345, 2)).toBe(2.35);
    expect(round(2.6)).toBe(3);
  });
});

describe("calcAge", () => {
  const today = new Date(2026, 10, 25); // 25 Nov 2026
  it("returns null without a date of birth", () => {
    expect(calcAge(null, today)).toBeNull();
  });
  it("counts a full year only after the birthday", () => {
    expect(calcAge("1990-11-25", today)).toBe(36);
    expect(calcAge("1990-11-26", today)).toBe(35);
  });
  it("returns null for an invalid date", () => {
    expect(calcAge("not-a-date", today)).toBeNull();
  });
  it("returns null for a date of birth in the future", () => {
    expect(calcAge("2030-01-01", today)).toBeNull();
  });
});

describe("BMI", () => {
  it("computes BMI from kilograms and centimetres", () => {
    expect(calcBMI(70, 175)).toBeCloseTo(22.857, 3);
  });
  it("returns null when weight or height is missing", () => {
    expect(calcBMI(0, 175)).toBeNull();
    expect(calcBMI(70, 0)).toBeNull();
  });
  it("classifies BMI using WHO bands with a lower bound included and upper bound excluded", () => {
    expect(bmiCategory(18.5)).toBe("Normal weight");
    expect(bmiCategory(18.49)).toBe("Mild thinness");
    expect(bmiCategory(30)).toBe("Obese Class I");
    expect(bmiCategory(40)).toBe("Obese Class III");
    expect(bmiCategory(null)).toBe("—");
    expect(bmiClass(null)).toBeNull();
  });
});

describe("fasting", () => {
  it("returns nulls when either meal time is missing", () => {
    expect(fastingStats(null, "2026-11-25T20:00:00")).toEqual({ eatingH: null, fastingH: null });
  });
  it("splits a 24-hour day into eating and fasting hours", () => {
    const s = fastingStats("2026-11-25T08:00:00", "2026-11-25T16:00:00");
    expect(s.eatingH).toBe(8);
    expect(s.fastingH).toBe(16);
  });
  it("returns nulls when the last meal is before the first", () => {
    expect(fastingStats("2026-11-25T20:00:00", "2026-11-25T08:00:00")).toEqual({ eatingH: null, fastingH: null });
  });
  it("reports 24 fasting hours for a fasted day", () => {
    expect(dayFastingHours({ fasted: true } as never)).toBe(24);
    expect(dayFastingHours(undefined)).toBeNull();
  });
});
