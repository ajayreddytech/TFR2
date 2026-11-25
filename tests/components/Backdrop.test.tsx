// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Backdrop } from "../../src/components/Backdrop";

describe("Backdrop", () => {
  it("is decorative: hidden from assistive tech and never intercepts clicks", () => {
    const { container } = render(<Backdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("pointer-events-none");
  });

  it("draws leaves, droplets and orbs behind the app", () => {
    const { container } = render(<Backdrop />);
    expect(container.querySelectorAll("svg path").length).toBeGreaterThan(10);
    expect(container.querySelectorAll(".bg-orb")).toHaveLength(3);
  });
});
