// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { RoutineView } from "../../src/components/RoutineView";
import { useStore } from "../../src/lib/store";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("RoutineView", () => {
  it("shows an empty checklist with a prompt", () => {
    render(<RoutineView />);
    expect(screen.getByRole("heading", { name: "Routine" })).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("adds a checklist item from the box", () => {
    render(<RoutineView />);
    fireEvent.change(screen.getByLabelText("New routine item"), { target: { value: "Drink water" } });
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    expect(useStore.getState().routine.map((r) => r.text)).toEqual(["Drink water"]);
  });

  it("does not add a blank item", () => {
    render(<RoutineView />);
    fireEvent.change(screen.getByLabelText("New routine item"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /Add/ })).toBeDisabled();
  });

  it("ticks an item off and back on", () => {
    resetStore({ routine: [{ id: "r1", text: "Walk", order: 0 } as never] });
    render(<RoutineView />);
    const box = screen.getByRole("checkbox", { name: 'Mark "Walk" as done' });
    expect(box).toHaveAttribute("aria-checked", "false");
    fireEvent.click(box);
    expect(Object.values(useStore.getState().routineChecks).some(Boolean)).toBe(true);
    expect(screen.getByRole("checkbox", { name: 'Mark "Walk" as done' })).toHaveAttribute("aria-checked", "true");
  });
});
