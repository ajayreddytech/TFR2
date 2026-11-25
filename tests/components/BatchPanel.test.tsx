// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BatchPanel } from "../../src/components/BatchPanel";
import { resetStore } from "../helpers/store";
import type { CookedBatch, FoodItem } from "../../src/lib/types";

const food = (name: string, calories: number): FoodItem => ({ name, quantity: "100 g", calories, macros: { protein_g: 1, carbs_g: 2, fat_g: 3, fiber_g: 0 }, micros: {} });

const batch: CookedBatch = {
  id: "b1",
  name: "Dal",
  createdAt: "2026-11-20T10:00:00.000Z",
  cookedWeightG: 900,
  servings: 3,
  ingredients: [food("Lentils", 300)],
  total: food("Dal", 420),
  remaining: 1,
};

beforeEach(() => resetStore());

describe("BatchPanel", () => {
  it("shows an empty state when no batches are cooked", () => {
    render(<BatchPanel onEat={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Cooked Batches" })).toBeInTheDocument();
  });

  it("lists each open batch with its name", () => {
    resetStore({ batches: [batch] });
    render(<BatchPanel onEat={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("Dal")).toBeInTheDocument();
  });

  it("applies the custom class name to its root", () => {
    const { container } = render(<BatchPanel onEat={vi.fn()} onEdit={vi.fn()} className="mt-8" />);
    expect(container.firstElementChild).toHaveClass("mt-8");
  });
});
