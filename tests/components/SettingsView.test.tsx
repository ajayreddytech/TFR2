// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsView } from "../../src/components/SettingsView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("SettingsView", () => {
  it("introduces the settings and shows the account section", () => {
    render(<SettingsView />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Your profile drives every target in the app.")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("says cloud sync is unavailable when Supabase is not configured", () => {
    render(<SettingsView />);
    expect(screen.getByText(/Guest mode/)).toBeInTheDocument();
  });

  it("shows the BMI progress section", () => {
    render(<SettingsView />);
    // Section titles are Title Cased by the shared UI.
    expect(screen.getByRole("heading", { name: "BMI Progress" })).toBeInTheDocument();
  });
});
