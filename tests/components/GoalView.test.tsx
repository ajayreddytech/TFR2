// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GoalView } from "../../src/components/GoalView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("GoalView", () => {
  it("asks for a starting goal when none is set", () => {
    render(<GoalView />);
    expect(screen.getByRole("heading", { name: "Goal" })).toBeInTheDocument();
    expect(screen.getByText("Set a target and watch the circle close in on it")).toBeInTheDocument();
    // Section titles are Title Cased by the shared UI, so "Start a goal" shows as "Start a Goal".
    expect(screen.getByRole("heading", { name: "Start a Goal" })).toBeInTheDocument();
  });

  it("gives a submit button for the goal form", () => {
    render(<GoalView />);
    expect(screen.getByRole("button", { name: /start|set|save|begin/i })).toBeInTheDocument();
  });
});
