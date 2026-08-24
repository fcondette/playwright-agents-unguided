// spec: Cart Viewing and Management
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Cart displays correct items, quantities, and totals for multiple products", async ({
		page,
	}) => {
		// 1. Reproduce the seed login flow (as in tests/seed.spec.ts)
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();

		// 2. Click nav-link-products, then use add-to-cart-1 on the products listing to add 'Écouteurs Sans Fil Pro'
		await page.getByTestId("nav-link-products").click();
		await page.getByTestId("add-to-cart-1").click();
		await expect(page.locator("[data-sonner-toast]")).toContainText(
			"Écouteurs Sans Fil Pro ajouté au panier",
		);
		await expect(page.getByTestId("cart-count")).toHaveText("1");

		// 3. Use add-to-cart-2 on the products listing to add 'Hub USB-C 12-en-1'
		await page.getByTestId("add-to-cart-2").click();
		await expect(page.getByTestId("cart-count")).toHaveText("2");

		// 4. Click cart-link to navigate to /cart (in-app click, not page.goto)
		await page.getByTestId("cart-link").click();
		await expect(page.getByRole("heading", { name: "Votre Panier" })).toBeVisible();

		// expect: Two line items are listed: 'Écouteurs Sans Fil Pro' at 199.99 € / unité and 'Hub USB-C 12-en-1' at 89.99 € / unité
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro", level: 3 }),
		).toBeVisible();
		await expect(page.getByText("199.99 € / unité")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1", level: 3 }),
		).toBeVisible();
		await expect(page.getByText("89.99 € / unité")).toBeVisible();

		// expect: quantity-1 and quantity-2 both show 1
		await expect(page.getByTestId("quantity-1")).toHaveText("1");
		await expect(page.getByTestId("quantity-2")).toHaveText("1");

		// expect: Récapitulatif shows 'Sous-total (2 articles)' = 289.98 €
		// expect: Livraison shows 'Gratuite'
		// expect: Total shows 289.98 € with 'TVA incluse' note
		const summary = page.getByRole("heading", { name: "Récapitulatif" }).locator("..");
		await expect(summary).toContainText("Sous-total (2 articles)");
		await expect(summary).toContainText("289.98 €");
		await expect(summary).toContainText("Livraison");
		await expect(summary).toContainText("Gratuite");
		await expect(summary).toContainText("Total");
		await expect(summary).toContainText("TVA incluse");
	});
});
