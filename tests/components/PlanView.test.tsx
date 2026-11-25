// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PlanView } from "../../src/components/PlanView";
import { todayISO } from "../../src/lib/dates";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("PlanView", () => {
  it("says there is no plan when nothing is planned", () => {
    render(<PlanView />);
    expect(screen.getByRole("heading", { name: "Meal Plan" })).toBeInTheDocument();
    expect(screen.getByText("No plan for today.", { exact: false })).toBeInTheDocument();
  });

  it("shows a planned meal for today", () => {
    resetStore({
      logs: {
        [todayISO()]: {
          date: todayISO(),
          meals: [{ id: "m1", bucket: "Lunch", items: [{ name: "Dal rice", quantity: "1 plate", calories: 500, macros: { protein_g: 15, carbs_g: 80, fat_g: 8, fiber_g: 6 }, micros: {} }] }],
          expenditure: 0, hydrationL: 0, gyr: null, nibbles: null, firstMealAt: null, lastMealAt: null, fasted: false, submitted: false,
          planned: true,
        } as never,
      },
    });
    render(<PlanView />);
    expect(screen.getByText("Dal rice", { exact: false })).toBeInTheDocument();
  });
});
