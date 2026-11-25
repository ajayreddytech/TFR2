// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { HeaderNav } from "../../src/components/HeaderNav";
import { useStore } from "../../src/lib/store";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("HeaderNav", () => {
  it("has a menu button that opens the secondary screens", () => {
    render(<HeaderNav />);
    const menu = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menu);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Routine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("opens the chosen screen and closes the menu", () => {
    render(<HeaderNav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Guide" }));
    expect(useStore.getState().view).toBe("guide");
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("marks the current screen", () => {
    resetStore({ view: "goal" });
    render(<HeaderNav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Goal" })).toHaveAttribute("aria-current", "page");
  });
});
