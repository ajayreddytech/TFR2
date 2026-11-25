// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealsModal } from "../../src/components/MealsModal";
import type { FoodItem, ParsedFood } from "../../src/lib/types";

const item = (over: Partial<FoodItem> = {}): FoodItem => ({
  name: "Idli",
  quantity: "2",
  calories: 120,
  macros: { protein_g: 4, carbs_g: 24, fat_g: 0.5, fiber_g: 1 },
  micros: {},
  ...over,
});

const blocks: ParsedFood[] = [
  { target_bucket: "Breakfast", items: [item()], transcript: "2 idlis" },
  { target_bucket: "Lunch", items: [item({ name: "Dal rice", calories: 500 })] },
];

afterEach(() => vi.unstubAllGlobals());

describe("MealsModal", () => {
  it("shows one editable block per meal, each with its bucket", () => {
    render(<MealsModal open mode="meal" blocks={blocks} onClose={() => {}} onConfirm={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const buckets = screen.getAllByRole("combobox", { name: "Meal bucket" }) as HTMLSelectElement[];
    expect(buckets.map((b) => b.value)).toEqual(["Breakfast", "Lunch"]);
  });

  it("confirms every block as it stands", () => {
    const onConfirm = vi.fn();
    render(<MealsModal open mode="meal" blocks={blocks} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /Confirm|Log|Save/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [confirmed] = onConfirm.mock.calls[0];
    expect(confirmed).toHaveLength(2);
  });

  it("shows the explanatory note when given", () => {
    render(<MealsModal open mode="meal" blocks={blocks} note="Recovered from a failed attempt" onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText("Recovered from a failed attempt")).toBeInTheDocument();
  });

  it("closes without confirming when the dialog is dismissed", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<MealsModal open mode="meal" blocks={blocks} onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    render(<MealsModal open={false} mode="meal" blocks={blocks} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
