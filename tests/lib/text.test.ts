import { describe, expect, it } from "vitest";
import { toTitleCase } from "../../src/lib/text";

describe("toTitleCase", () => {
  it("capitalises each significant word", () => {
    expect(toTitleCase("chicken curry bowl")).toBe("Chicken Curry Bowl");
  });
  it("keeps minor words lowercase mid-title", () => {
    expect(toTitleCase("bread and butter with jam")).toBe("Bread and Butter with Jam");
  });
  it("capitalises a minor word at the start", () => {
    expect(toTitleCase("the end")).toBe("The End");
  });
  it("skips leading punctuation when capitalising", () => {
    expect(toTitleCase("(homemade) soup")).toBe("(Homemade) Soup");
  });
  it("leaves empty input alone", () => {
    expect(toTitleCase("")).toBe("");
  });
});
