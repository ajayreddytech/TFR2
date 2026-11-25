// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { RecipesView } from "../../src/components/RecipesView";
import { resetStore } from "../helpers/store";

beforeEach(() => resetStore());

describe("RecipesView", () => {
  it("shows the recipes heading and the category list", () => {
    render(<RecipesView />);
    expect(screen.getByRole("heading", { name: "Recipes & Meal Prep" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Recipe categories" })).toBeInTheDocument();
  });

  it("starts with quick meals", () => {
    render(<RecipesView />);
    expect(screen.getAllByText(/Quick Meals/).length).toBeGreaterThan(0);
  });
});
