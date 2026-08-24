// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart to Checkout Transition", () => {
	test('"Continuer mes achats" from the cart returns to the products page without losing prior selections', async ({
		page,
	}) => {
		// 1. Login, add product 1 to the cart, navigate to /cart via cart-link.
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();

		await page.getByTestId("nav-link-products").click();
		await page.getByRole("link", { name: "Écouteurs Sans Fil Pro" }).click();
		await page.getByTestId("product-detail-add-to-cart").click();
		await expect(page.locator("[data-sonner-toast]")).toContainText(
			"Écouteurs Sans Fil Pro ajouté au panier",
		);

		const cartCount = page.getByTestId("cart-count");
		await expect(cartCount).toHaveText("1");

		await page.getByTestId("cart-link").click();
		await expect(page).toHaveURL(/\/cart$/);
		await expect(
			page.getByRole("heading", { name: "Votre Panier" }),
		).toBeVisible();
		await expect(cartCount).toHaveText("1");

		// 2. Click continue-shopping-button ('Continuer mes achats').
		await page.getByTestId("continue-shopping-button").click();
		await expect(page).toHaveURL(/\/products$/);
		await expect(cartCount).toHaveText("1");
	});
});
