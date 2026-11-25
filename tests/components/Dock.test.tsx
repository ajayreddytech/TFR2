// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Dock } from "../../src/components/Dock";
import { useStore } from "../../src/lib/store";

beforeEach(() => {
  useStore.setState({ view: "log" });
});

afterEach(() => {
  cleanup();
});

describe("Dock navigation", () => {
  it("shows a button for each main screen", () => {
    render(<Dock />);
    for (const label of ["Log", "Meal Plan", "Calendar / History", "Insights & Graphs", "Nutrient Breakdown", "Weight Tracking"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the current screen as the active page", () => {
    render(<Dock />);
    expect(screen.getByRole("button", { name: "Log" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Weight Tracking" })).not.toHaveAttribute("aria-current");
  });

  it("switches the app to the chosen screen", () => {
    render(<Dock />);
    fireEvent.click(screen.getByRole("button", { name: "Weight Tracking" }));
    expect(useStore.getState().view).toBe("weight");
    expect(screen.getByRole("button", { name: "Weight Tracking" })).toHaveAttribute("aria-current", "page");
  });
});
