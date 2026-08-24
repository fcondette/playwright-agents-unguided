// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Cart Viewing and Management", () => {
	test("Clearing the entire cart empties it immediately", async ({ page }) => {
		// 1. Login, add product 1 and product 2 to the cart, navigate to /cart via cart-link.
		await page.getByTestId("nav-link-products").click();
		await page.getByRole("link", { name: "Hub USB-C 12-en-1" }).click();
		await page.getByTestId("product-detail-add-to-cart").click();
		await expect(page.locator("[data-sonner-toast]")).toContainText(
			"Hub USB-C 12-en-1 ajouté au panier",
		);
		await expect(page.getByTestId("cart-count")).toHaveText("2");

		await page.getByTestId("cart-link").click();

		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();
		const clearCartButton = page.getByTestId("clear-cart-button");
		await expect(clearCartButton).toBeVisible();

		// 2. Click clear-cart-button.
		await clearCartButton.click();

		// expect: No confirmation dialog appears
		// expect: The cart immediately shows the empty state: heading 'Votre panier est vide' with a 'Voir les produits' link
		await expect(
			page.getByRole("heading", { name: "Votre panier est vide" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Voir les produits" }),
		).toBeVisible();

		// expect: Header cart-count badge is no longer shown (or shows no count)
		await expect(page.getByTestId("cart-count")).toBeHidden();
	});
});
