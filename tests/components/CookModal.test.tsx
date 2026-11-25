// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CookModal } from "../../src/components/CookModal";
import type { CookDraft } from "../../src/lib/parseClient";
import type { FoodItem } from "../../src/lib/types";

const ing = (name: string): FoodItem => ({ name, quantity: "100 g", calories: 100, macros: { protein_g: 1, carbs_g: 2, fat_g: 3, fiber_g: 0 }, micros: {} });

const draft: CookDraft = { name: "Dal", cookedWeightG: 900, servings: 3, items: [ing("Lentils"), ing("Oil")] };

describe("CookModal", () => {
  it("shows the dish name, weight and ingredients of a cooked batch", () => {
    render(<CookModal draft={draft} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("900")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Ingredient").map((i) => (i as HTMLInputElement).value)).toEqual(["Lentils", "Oil"]);
  });

  it("saves the edited batch", () => {
    const onSave = vi.fn();
    render(<CookModal draft={draft} onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove ingredient" })[1]);
    fireEvent.click(screen.getByRole("button", { name: /Save|Confirm|Done/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].items.map((i: FoodItem) => i.name)).toEqual(["Lentils"]);
  });

  it("will not save a batch with no name", () => {
    const onSave = vi.fn();
    render(<CookModal draft={{ ...draft, name: "" }} onClose={() => {}} onSave={onSave} />);
    expect(screen.getByRole("button", { name: /Save|Confirm|Done/i })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("renders nothing without a draft", () => {
    render(<CookModal draft={null} onClose={() => {}} onSave={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
