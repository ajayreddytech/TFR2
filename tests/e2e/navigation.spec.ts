import { expect, test, type Page } from "@playwright/test";

/** Every screen, how to reach it, and the heading it shows. */
const SCREENS: { label: string; via: "dock" | "menu"; heading: RegExp }[] = [
  { label: "Log", via: "dock", heading: /TheFoodRelationship/ },
  { label: "Meal Plan", via: "dock", heading: /^Meal Plan$/ },
  { label: "Calendar / History", via: "dock", heading: /Calendar & History/ },
  { label: "Insights & Graphs", via: "dock", heading: /Insights & Graphs/ },
  { label: "Nutrient Breakdown", via: "dock", heading: /Complete Nutrient Breakdown/ },
  { label: "Weight Tracking", via: "dock", heading: /Weight Tracking/ },
  { label: "Routine", via: "menu", heading: /^Routine$/ },
  { label: "Goal", via: "menu", heading: /^Goal$/ },
  { label: "Recipes & Meal Prep", via: "menu", heading: /Recipes & Meal Prep/ },
  { label: "Guide", via: "menu", heading: /^Guide$/ },
  { label: "Settings", via: "menu", heading: /^Settings$/ },
];

async function openScreen(page: Page, label: string, via: "dock" | "menu") {
  if (via === "menu") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
  } else {
    await page.getByRole("button", { name: label, exact: true }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("every screen opens and shows its heading", async ({ page }) => {
  for (const s of SCREENS) {
    await openScreen(page, s.label, s.via);
    await expect(page.getByRole("heading", { name: s.heading }).first(), `${s.label} heading`).toBeVisible({ timeout: 10_000 });
  }
});

test("every screen fits a phone width with no sideways scrolling", async ({ page }) => {
  for (const s of SCREENS) {
    await openScreen(page, s.label, s.via);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${s.label} overflow`).toBeLessThanOrEqual(1);
  }
});

test("no screen logs a console error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const s of SCREENS) {
    await openScreen(page, s.label, s.via);
    await page.waitForTimeout(300);
  }
  expect(errors).toEqual([]);
});

test("the menu closes after choosing a screen", async ({ page }) => {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});
