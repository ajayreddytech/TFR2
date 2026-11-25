// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GuideView } from "../../src/components/GuideView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("GuideView", () => {
  it("shows the guide title and its section list", () => {
    render(<GuideView />);
    expect(screen.getByRole("heading", { name: "Guide" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Guide sections" })).toBeInTheDocument();
  });

  it("shows the Safe Practices section and the What if section", () => {
    render(<GuideView />);
    expect(screen.getAllByText(/Safe Practices/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /What if/ }));
    expect(screen.getByText("Quick answers for tricky moments")).toBeInTheDocument();
  });

  it("opens the editor for a new question", () => {
    render(<GuideView />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getByPlaceholderText("Add a new point…")).toBeInTheDocument();
  });
});
