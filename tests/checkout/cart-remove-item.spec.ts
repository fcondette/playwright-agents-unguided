// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Cart Viewing and Management", () => {
	test("Removing an item via the remove button deletes it immediately without confirmation", async ({
		page,
	}) => {
		// 1. Login, add product 1 ("Écouteurs Sans Fil Pro") and product 2 ("Hub USB-C 12-en-1") to the cart, navigate to /cart via cart-link.
		await page.locator('a:has-text("Hub USB-C 12-en-1")').click();
		await page.getByTestId("product-detail-add-to-cart").click();
		await expect(page.locator("[data-sonner-toast]")).toContainText(
			"Hub USB-C 12-en-1 ajouté au panier",
		);
		await page.getByTestId("cart-link").click();
		await expect(page).toHaveURL(/\/cart$/);
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();

		// 2. Click remove-item-1.
		// expect: No confirmation dialog appears
		page.once("dialog", (dialog) => {
			throw new Error(
				`Unexpected confirmation dialog appeared: ${dialog.message()}`,
			);
		});
		await page.getByTestId("remove-item-1").click();

		// expect: The 'Écouteurs Sans Fil Pro' line item disappears immediately
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toHaveCount(0);

		// expect: Only 'Hub USB-C 12-en-1' remains, with Récapitulatif and cart-count reflecting 1 item / 89.99 €
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();
		await expect(page.getByText("Sous-total (1 article)")).toBeVisible();
		await expect(page.getByText("289.98 €")).toHaveCount(0);
		await expect(page.getByText("199.99 €", { exact: true })).toHaveCount(0);
		await expect(page.getByTestId("cart-count")).toHaveText("1");
	});
});
