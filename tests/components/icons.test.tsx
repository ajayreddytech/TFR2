// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DigitalScale, GYR_STYLE, METRICS, MetricIcon, MetricTile, NibbleMark } from "../../src/components/icons";

describe("DigitalScale", () => {
  it("renders a decorative svg at the requested size", () => {
    const { container } = render(<DigitalScale size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

describe("metric and GYR definitions", () => {
  it("gives every metric a label, colour and icon", () => {
    for (const [kind, m] of Object.entries(METRICS)) {
      expect(m.label, kind).toBeTruthy();
      expect(m.hex, kind).toMatch(/^#[0-9a-f]{6}$/i);
      expect(m.Icon, kind).toBeDefined();
    }
  });

  it("names the three GYR levels with their Satvik, in-between and Tamasik hints", () => {
    expect(GYR_STYLE.green.hint).toBe("Satvik");
    expect(GYR_STYLE.yellow.hint).toBe("In between");
    expect(GYR_STYLE.red.hint).toBe("Tamasik");
  });
});

describe("NibbleMark", () => {
  it("shows a restraint hand when there is no record", () => {
    const { container } = render(<NibbleMark nibbled={null} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("shows the good mark for a day with no nibbles", () => {
    const { container } = render(<NibbleMark nibbled={false} />);
    expect(container.querySelector(".text-good")).not.toBeNull();
  });

  it("shows the bad mark for a day with nibbles", () => {
    const { container } = render(<NibbleMark nibbled />);
    expect(container.querySelector(".text-amber-600")).not.toBeNull();
    expect(container.querySelector(".bg-bad")).not.toBeNull();
  });
});

describe("MetricIcon and MetricTile", () => {
  it("colours the icon with its metric colour", () => {
    const { container } = render(<MetricIcon kind="hydration" />);
    expect(container.querySelector("svg")).toHaveClass("text-sky-500");
  });

  it("uses the metric background unless a custom tone is given", () => {
    const plain = render(<MetricTile kind="intake" />).container.firstElementChild;
    expect(plain).toHaveClass("bg-emerald-500/15");
    const toned = render(<MetricTile kind="intake" tone="text-red-500" />).container.firstElementChild;
    expect(toned).not.toHaveClass("bg-emerald-500/15");
  });
});
