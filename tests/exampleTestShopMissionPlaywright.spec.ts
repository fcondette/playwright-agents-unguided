import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
	await page.goto("https://shop.missionplaywright.fr/");

	// Expect a title "to contain" Mission Playwright.
	await expect(page).toHaveTitle(
		/La technologie qui simplifie votre quotidien/,
	);
});

test("get started link", async ({ page }) => {
	await page.goto("https://shop.missionplaywright.fr/");

	// Click the Découvrir les produits link.
	await page.getByRole("link", { name: "Découvrir les produits" }).click();

	// Expects page to have a heading with the name of Notre catalogue.
	await expect(
		page.getByRole("heading", { name: "Notre catalogue" }),
	).toBeVisible();
});
