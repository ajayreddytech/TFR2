// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import type { FoodItem, ParsedFood } from "../../src/lib/types";

const item = (over: Partial<FoodItem> = {}): FoodItem => ({
  name: "Rice",
  quantity: "100 g",
  calories: 130,
  macros: { protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 },
  micros: {},
  ...over,
});

const parsed: ParsedFood = { target_bucket: "Lunch", items: [item(), item({ name: "Dal", calories: 90 })], transcript: "rice and dal" };

afterEach(() => {
  cleanup();
});

describe("ConfirmModal", () => {
  it("shows the parsed items for review", () => {
    render(<ConfirmModal parsed={parsed} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Confirm meal" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Meal bucket" })).toHaveValue("Lunch");
    const names = screen.getAllByLabelText("Item") as HTMLInputElement[];
    expect(names.map((n) => n.value)).toEqual(["Rice", "Dal"]);
  });

  it("confirms the meal with the edited items", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal parsed={parsed} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.change(screen.getAllByLabelText("Calories")[0], { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [bucket, items] = onConfirm.mock.calls[0];
    expect(bucket).toBe("Lunch");
    expect(items[0].calories).toBe(200);
    expect(items).toHaveLength(2);
  });

  it("removes an item and does not let the meal be confirmed with no items left", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal parsed={parsed} onClose={() => {}} onConfirm={onConfirm} />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove item" });
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove item" })[0]);
    expect(screen.queryAllByLabelText("Item")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("blocks confirming while an item has no name", () => {
    render(<ConfirmModal parsed={parsed} onClose={() => {}} onConfirm={() => {}} />);
    fireEvent.change(screen.getAllByLabelText("Item")[0], { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("calls onClose when cancelled", () => {
    const onClose = vi.fn();
    render(<ConfirmModal parsed={parsed} onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when there is no parsed meal", () => {
    render(<ConfirmModal parsed={null} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
