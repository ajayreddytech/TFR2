// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CalendarView } from "../../src/components/CalendarView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("CalendarView", () => {
  it("introduces the calendar and shows the current month", () => {
    render(<CalendarView />);
    expect(screen.getByRole("heading", { name: "Calendar & History" })).toBeInTheDocument();
    expect(screen.getByText("Tap a day to add, edit or delete its entry")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Calendar view" })).toBeInTheDocument();
  });

  it("offers a jump back to the current period", () => {
    render(<CalendarView />);
    expect(screen.getByRole("combobox", { name: "Jump to current" })).toBeInTheDocument();
  });
});
