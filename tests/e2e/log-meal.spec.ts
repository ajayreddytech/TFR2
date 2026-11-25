import { expect, test } from "@playwright/test";

// The production service worker would answer API calls before Playwright's route mock sees them, so block it here.
test.use({ serviceWorkers: "block" });

const PARSED = {
  kind: "meals",
  transcript: "two idlis for breakfast",
  meals: [
    {
      target_bucket: "Breakfast",
      items: [{ name: "Idli", quantity: "2 idlis", calories: 130, macros: { protein_g: 4, carbs_g: 26, fat_g: 0.5, fiber_g: 1 }, micros: {} }],
    },
  ],
};

test.beforeEach(async ({ page }) => {
  // The browser never reaches the real AI in tests: the parse route is answered here instead.
  await page.route("**/api/parse-food", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PARSED) }),
  );
  await page.goto("/");
});

test("typing a meal shows it for confirmation, then logs it", async ({ page }) => {
  await page.getByRole("textbox", { name: "Describe your food" }).fill("two idlis for breakfast");
  await page.getByRole("button", { name: "Send" }).click();

  const dialog = page.getByRole("dialog", { name: "Confirm meal" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Item").first()).toHaveValue("Idli");

  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(dialog).toBeHidden();
  // The meal now appears in today's log, under its bucket.
  await expect(page.getByText("Idli").first()).toBeVisible();
  await expect(page.getByText("Breakfast").first()).toBeVisible();
});

test("the confirm dialog can be cancelled without logging anything", async ({ page }) => {
  await page.getByRole("textbox", { name: "Describe your food" }).fill("two idlis for breakfast");
  await page.getByRole("button", { name: "Send" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm meal" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: /Logged to/ })).toHaveCount(0);
});

test("a food the AI cannot recognise shows its message", async ({ page }) => {
  await page.unroute("**/api/parse-food");
  await page.route("**/api/parse-food", (route) =>
    route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "No food items recognised. Try rephrasing." }) }),
  );
  await page.getByRole("textbox", { name: "Describe your food" }).fill("hmm");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No food items recognised" })).toBeVisible();
});
