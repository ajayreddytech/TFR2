// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingMeals } from "../../src/components/PendingMeals";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("PendingMeals", () => {
  it("renders nothing when signed out, because saved meals belong to an account", () => {
    const { container } = render(<PendingMeals canAutoOpen={false} onReview={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not try to load anything while signed out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PendingMeals canAutoOpen={false} onReview={vi.fn()} />);
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    vi.unstubAllGlobals();
  });
});
