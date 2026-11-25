// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { InsightsView } from "../../src/components/InsightsView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("InsightsView", () => {
  it("introduces the insights screen", () => {
    render(<InsightsView />);
    expect(screen.getByRole("heading", { name: "Insights & Graphs" })).toBeInTheDocument();
    expect(screen.getByText("Running averages over the days you've logged")).toBeInTheDocument();
  });

  it("shows the average tiles and says how many days are counted", () => {
    render(<InsightsView />);
    expect(screen.getByText("Avg intake")).toBeInTheDocument();
    expect(screen.getByText("Avg hydration")).toBeInTheDocument();
    expect(screen.getByText(/Based on 0 logged day/)).toBeInTheDocument();
  });
});
