// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SourcesModal } from "../../src/components/SourcesModal";
import { NUTRIENTS } from "../../src/lib/nutrients";
import type { FoodItem } from "../../src/lib/types";

const protein = NUTRIENTS.find((n) => n.key === "protein_g")!;

const item = (name: string, value: number): FoodItem => ({
  name, quantity: "1", calories: 0, macros: { protein_g: value, carbs_g: 0, fat_g: 0, fiber_g: 0 }, micros: {},
});

describe("SourcesModal", () => {
  it("ranks the foods that supply the nutrient", () => {
    render(<SourcesModal nutrient={protein} items={[item("Egg", 6), item("Chicken", 24)]} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Each source's bar is labelled with its food name, in rank order.
    const ranked = screen.getAllByRole("progressbar").map((bar) => bar.getAttribute("aria-label"));
    expect(ranked).toEqual(["Chicken", "Egg"]);
  });

  it("shows a progress bar for each source's share", () => {
    render(<SourcesModal nutrient={protein} items={[item("Egg", 6), item("Chicken", 24)]} onClose={() => {}} />);
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(<SourcesModal nutrient={protein} items={[item("Egg", 6)]} onClose={onClose} />);
    const closes = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closes[closes.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing without a nutrient", () => {
    render(<SourcesModal nutrient={null} items={[]} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
