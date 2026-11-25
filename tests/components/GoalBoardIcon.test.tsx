// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoalBoardIcon } from "../../src/components/GoalBoardIcon";

describe("GoalBoardIcon", () => {
  it("renders an svg at the default size", () => {
    const { container } = render(<GoalBoardIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("accepts a custom size and class", () => {
    const { container } = render(<GoalBoardIcon size={40} className="text-brand" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "40");
    expect(svg).toHaveClass("text-brand");
  });
});
