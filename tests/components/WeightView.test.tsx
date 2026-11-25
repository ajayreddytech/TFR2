// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { WeightView } from "../../src/components/WeightView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("WeightView", () => {
  it("introduces the weight tracking screen", () => {
    render(<WeightView />);
    expect(screen.getByRole("heading", { name: "Weight Tracking" })).toBeInTheDocument();
    expect(screen.getByText(/Logging weight updates BMI, BMR/)).toBeInTheDocument();
  });

  it("offers an Add button for a new weigh-in", () => {
    render(<WeightView />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
