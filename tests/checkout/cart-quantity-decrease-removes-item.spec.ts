// spec: Cart Viewing and Management - Decreasing item quantity to zero removes the item from the cart
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Cart Viewing and Management", () => {
	test("Decreasing item quantity to zero removes the item from the cart", async ({
		page,
	}) => {
		// 1. Login, add both product 1 ('Écouteurs Sans Fil Pro') and product 2 ('Hub USB-C 12-en-1') to the cart, then navigate to /cart via cart-link.
		await page.getByTestId("nav-link-products").click();
		await page.getByTestId("add-to-cart-2").click();
		await expect(
			page.getByText("Hub USB-C 12-en-1 ajouté au"),
		).toBeVisible();
		await page.getByTestId("cart-link").click();

		const cartCount = page.getByTestId("cart-count");
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();
		await expect(cartCount).toHaveText("2");

		// 2. Click decrease-quantity-1 once (quantity was 1).
		await page.getByTestId("decrease-quantity-1").click();

		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).not.toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();
		const subtotalRow = page.getByText("Sous-total (1 article)").locator("..");
		await expect(subtotalRow).toContainText("89.99 €");
		await expect(cartCount).toHaveText("1");
	});
});
