// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PagedChart } from "../../src/components/PagedChart";
import type { DayPoint } from "../../src/lib/analytics";
import { todayISO } from "../../src/lib/dates";
import type { DailyLog } from "../../src/lib/types";

const log = (date: string, hydrationL: number): DailyLog => ({
  date, meals: [], expenditure: 0, hydrationL, gyr: null, nibbles: null, firstMealAt: null, lastMealAt: null, fasted: false, submitted: false,
});

const logs = { [todayISO()]: log(todayISO(), 2.5) };

const props = {
  logs,
  gran: "week" as const,
  anchor: todayISO(),
  title: "Hydration",
  subtitle: "litres per day",
  icon: null,
  color: "#0ea5e9",
  unit: "L",
  decimals: 1,
  pick: (p: DayPoint) => p.hydration ?? null,
};

beforeEach(() => {
  // The chart scrolls its pages into view; jsdom doesn't lay out, so stub the scroll methods.
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("PagedChart", () => {
  it("shows its title and a subtitle that names the period", () => {
    render(<PagedChart {...props} />);
    expect(screen.getAllByRole("heading", { name: "Hydration" }).length).toBeGreaterThan(0);
    // The subtitle is "<subtitle> · <period label>", e.g. "litres per day · Nov 22 – Nov 28, 2026".
    expect(screen.getAllByText(/litres per day · .*–/).length).toBeGreaterThan(0);
  });

  it("offers earlier and later arrows named after the chart", () => {
    render(<PagedChart {...props} />);
    expect(screen.getByRole("button", { name: "Earlier Hydration" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Later Hydration" })).toBeInTheDocument();
  });

  it("scrolls the page strip back with the Earlier arrow", () => {
    render(<PagedChart {...props} />);
    const scrollBy = Element.prototype.scrollBy as unknown as ReturnType<typeof vi.fn>;
    scrollBy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Earlier Hydration" }));
    // jsdom has no layout, so the distance is 0 here; the browser test checks the real movement.
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
  });
});
