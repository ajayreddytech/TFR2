// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BatchStock } from "../../src/components/BatchStock";
import type { CookDraft } from "../../src/lib/parseClient";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

const draft: CookDraft = { name: "Dal", cookedWeightG: 900, servings: 3, items: [] };

describe("BatchStock", () => {
  it("shows nothing when there is no incoming draft", () => {
    const { container } = render(<BatchStock incoming={null} />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("opens the cook form for an incoming draft and tells the parent it was taken", () => {
    const onConsumed = vi.fn();
    render(<BatchStock incoming={draft} onConsumed={onConsumed} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dal")).toBeInTheDocument();
    expect(onConsumed).toHaveBeenCalledTimes(1);
  });
});
