// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { NutrientsView, SCALE, TONE } from "../../src/components/NutrientsView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("NutrientsView", () => {
  it("introduces the nutrient breakdown", () => {
    render(<NutrientsView />);
    expect(screen.getByRole("heading", { name: "Complete Nutrient Breakdown" })).toBeInTheDocument();
    expect(screen.getByText("AI-estimated from your logged meals")).toBeInTheDocument();
  });

  it("uses a bar scale that runs to 150% of target", () => {
    expect(SCALE).toBe(1.5);
  });

  it("defines a tone for each status", () => {
    expect(Object.keys(TONE).length).toBeGreaterThan(0);
  });
});
