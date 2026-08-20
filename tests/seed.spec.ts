import { test, expect } from "@playwright/test";

test.describe("Shop home page", () => {
	test("seed", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(
			/La technologie qui simplifie votre quotidien/,
		);
	});
});
