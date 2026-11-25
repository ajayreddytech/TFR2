import { expect, test } from "@playwright/test";

test("a routine item is added, ticked, and survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Routine", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Routine$/ })).toBeVisible();

  await page.getByLabel("New routine item").fill("Drink a glass of water");
  await page.getByRole("button", { name: /Add/ }).click();
  const box = page.getByRole("checkbox", { name: 'Mark "Drink a glass of water" as done' });
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute("aria-checked", "false");

  await box.click();
  await expect(page.getByRole("checkbox", { name: 'Mark "Drink a glass of water" as done' })).toHaveAttribute("aria-checked", "true");

  // The app keeps its data on the device, so the item is still there after a reload.
  await page.reload();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Routine", exact: true }).click();
  await expect(page.getByText("Drink a glass of water")).toBeVisible();
});
