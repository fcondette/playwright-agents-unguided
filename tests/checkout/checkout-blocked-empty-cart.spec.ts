// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart to Checkout Transition", () => {
	test("Direct navigation to /checkout with an empty cart is blocked", async ({
		page,
	}) => {
		// 1. Login only, ensure the cart is empty (do not add products), then navigate directly to /checkout.
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();

		await page.goto("/checkout");

		// expect: The checkout page shows the empty-cart state (heading 'Votre panier est vide') instead of the shipping-form
		await expect(
			page.getByRole("heading", { name: "Votre panier est vide" }),
		).toBeVisible();

		// expect: No shipping/payment fields are rendered
		await expect(page.locator("input")).toHaveCount(0);

		// expect: A link back to /products ('Voir les produits') is shown
		await expect(
			page.getByRole("link", { name: "Voir les produits" }),
		).toBeVisible();
	});
});
