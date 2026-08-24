// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Empty cart shows an empty state and offers no checkout action", async ({
		page,
	}) => {
		// 1. Login only (do not add any product to the cart) and click cart-link to navigate to /cart.
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();

		await page.getByTestId("cart-link").click();
		await expect(page).toHaveURL("/cart");

		// expect: Heading 'Votre panier est vide' is visible
		await expect(
			page.getByRole("heading", { name: "Votre panier est vide" }),
		).toBeVisible();

		// expect: Text 'Découvrez notre catalogue et ajoutez des produits à votre panier.' is visible
		await expect(
			page.getByText(
				"Découvrez notre catalogue et ajoutez des produits à votre panier.",
				{ exact: true },
			),
		).toBeVisible();

		// expect: A 'Voir les produits' button/link to /products is visible
		const viewProductsLink = page.getByRole("link", {
			name: "Voir les produits",
		});
		await expect(viewProductsLink).toBeVisible();
		await expect(viewProductsLink).toHaveAttribute("href", "/products");

		// expect: No 'Passer au paiement' checkout button is present
		await expect(
			page.getByRole("button", { name: "Passer au paiement" }),
		).toHaveCount(0);
	});
});
