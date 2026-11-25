// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AppShell } from "../../src/components/AppShell";
import { useStore } from "../../src/lib/store";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("AppShell", () => {
  it("opens on the log screen with the primary navigation", () => {
    render(<AppShell />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /TheFoodRelationship/ })).toBeInTheDocument();
  });

  it("swaps the main content when the screen changes", async () => {
    render(<AppShell />);
    act(() => useStore.getState().setView("weight"));
    // Screens animate out before the next one mounts, so wait for the new heading.
    expect(await screen.findByRole("heading", { name: "Weight Tracking" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("heading", { name: /TheFoodRelationship/ })).toBeNull());
  });

  it("renders the main landmark", () => {
    const { container } = render(<AppShell />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});
