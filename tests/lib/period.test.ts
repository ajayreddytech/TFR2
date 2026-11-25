import { describe, expect, it } from "vitest";
import { shiftAnchor, windowFor } from "../../src/lib/period";

describe("windowFor", () => {
  it("day view covers the trailing days ending on the anchor", () => {
    const w = windowFor("day", "2026-11-25", 7);
    expect(w.from).toBe("2026-11-19");
    expect(w.to).toBe("2026-11-25");
  });
  it("a one-day trail covers only the anchor", () => {
    const w = windowFor("day", "2026-11-25", 1);
    expect(w.from).toBe("2026-11-25");
    expect(w.to).toBe("2026-11-25");
  });
  it("week view runs Sunday to Saturday", () => {
    // 25 Nov 2026 is a Wednesday
    const w = windowFor("week", "2026-11-25");
    expect(w.from).toBe("2026-11-22");
    expect(w.to).toBe("2026-11-28");
  });
  it("month view spans the whole calendar month, including leap-year February", () => {
    expect(windowFor("month", "2024-02-10")).toMatchObject({ from: "2024-02-01", to: "2024-02-29" });
    expect(windowFor("month", "2026-11-03")).toMatchObject({ from: "2026-11-01", to: "2026-11-30" });
  });
  it("year view spans January 1 to December 31", () => {
    expect(windowFor("year", "2026-06-15")).toMatchObject({ from: "2026-01-01", to: "2026-12-31", label: "2026" });
  });
});

describe("shiftAnchor", () => {
  it("moves by one day, week, month or year", () => {
    expect(shiftAnchor("day", "2026-11-25", 1)).toBe("2026-11-26");
    expect(shiftAnchor("week", "2026-11-25", -1)).toBe("2026-11-18");
    expect(shiftAnchor("month", "2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftAnchor("year", "2026-06-15", 1)).toBe("2027-01-01");
  });
});
