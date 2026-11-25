// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NutrientModal, sumNutrient } from "../../src/components/NutrientModal";
import type { FoodItem } from "../../src/lib/types";

const item = (name: string, protein: number, fiber: number): FoodItem => ({
  name, quantity: "1", calories: 100, macros: { protein_g: protein, carbs_g: 0, fat_g: 0, fiber_g: fiber }, micros: {},
});

const items = [item("Egg", 6, 0), item("Dal", 9, 4)];

describe("sumNutrient", () => {
  it("adds one nutrient across all items", () => {
    expect(sumNutrient(items, "protein_g")).toBe(15);
    expect(sumNutrient(items, "fiber_g")).toBe(4);
  });

  it("returns 0 for a nutrient no item has", () => {
    expect(sumNutrient(items, "vitamin_c_mg")).toBe(0);
  });
});

describe("NutrientModal", () => {
  it("opens for a nutrient group and names the subtitle", () => {
    render(<NutrientModal kind="macro" subtitle="Lunch · whole batch" items={items} calories={200} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Lunch · whole batch/)).toBeInTheDocument();
    expect(screen.getByText(/200 kcal/)).toBeInTheDocument();
  });

  it("closes from the header or footer close button", () => {
    const onClose = vi.fn();
    render(<NutrientModal kind="macro" subtitle="x" items={items} calories={200} onClose={onClose} />);
    const closes = screen.getAllByRole("button", { name: "Close" });
    expect(closes).toHaveLength(2);
    fireEvent.click(closes[0]);
    fireEvent.click(closes[1]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing when no nutrient view is open", () => {
    render(<NutrientModal kind={null} subtitle="x" items={items} calories={200} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
