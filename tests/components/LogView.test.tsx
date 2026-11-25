// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LogView } from "../../src/components/LogView";
import { useStore } from "../../src/lib/store";
import { todayISO } from "../../src/lib/dates";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("LogView", () => {
  it("shows the app title and the eating window controls", () => {
    render(<LogView />);
    expect(screen.getByRole("heading", { name: /TheFoodRelationship/ })).toBeInTheDocument();
    expect(screen.getByText("Eating window")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clock in/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clock off/ })).toBeInTheDocument();
  });

  it("clocks in for today when the Clock in button is pressed", () => {
    render(<LogView />);
    fireEvent.click(screen.getByRole("button", { name: /Clock in/ }));
    expect(useStore.getState().logs[todayISO()]?.firstMealAt).toBeTruthy();
  });

  it("adds a glass of water with More water", () => {
    render(<LogView />);
    fireEvent.click(screen.getByRole("button", { name: "More water" }));
    expect(useStore.getState().logs[todayISO()]?.hydrationL).toBeGreaterThan(0);
  });

  it("never takes hydration below zero with Less water", () => {
    render(<LogView />);
    fireEvent.click(screen.getByRole("button", { name: "Less water" }));
    expect(useStore.getState().logs[todayISO()]?.hydrationL ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("shows the expenditure field for today's inputs", () => {
    render(<LogView />);
    expect(screen.getByRole("spinbutton", { name: "Expenditure kcal" })).toBeInTheDocument();
  });
});
