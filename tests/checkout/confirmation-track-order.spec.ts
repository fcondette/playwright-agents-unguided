// spec: spec/authenticated-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Order Confirmation", () => {
	test('"Suivre ma commande" on the confirmation page navigates to the account/order tracking page', async ({
		page,
	}) => {
		// 1. Login, add a product to the cart and complete checkout (shipping + valid payment) to reach the Confirmation step.
		await test.step("login", async () => {
			await page.goto("/");
			await page.getByTestId("login-button").click();
			await page.getByTestId("login-email-input").fill(email);
			await page.getByTestId("login-password-input").fill(password);
			await page.getByTestId("login-submit-button").click();
			await expect(
				page.getByText("Connexion réussie", { exact: true }),
			).toBeVisible();
		});

		await test.step("add product to cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByRole("link", { name: "Écouteurs Sans Fil Pro" }).click();
			await page.getByTestId("product-detail-add-to-cart").click();
			await expect(page.locator("[data-sonner-toast]")).toContainText(
				"Écouteurs Sans Fil Pro ajouté au panier",
			);
			await expect(page.getByTestId("cart-count")).toHaveText("1");
		});

		await test.step("complete checkout (shipping + valid payment) to reach the Confirmation step", async () => {
			await page.getByTestId("cart-link").click();
			await page.getByTestId("checkout-button").click();
			await page.getByTestId("shipping-submit-button").click();

			await page
				.getByTestId("payment-cardnumber-input")
				.fill("4242424242424242");
			await page.getByTestId("payment-cardname-input").fill("Test User");
			await page.getByTestId("payment-expiry-input").fill("12/28");
			await page.getByTestId("payment-cvv-input").fill("123");
			await page.getByTestId("payment-submit-button").click();
		});

		const trackOrderButton = page.getByTestId("track-order-button");

		await test.step("verify order-confirmation-card and track-order-button are visible", async () => {
			await expect(page.getByTestId("order-confirmation-card")).toBeVisible();
			await expect(trackOrderButton).toBeVisible();
		});

		// 2. Click track-order-button ('Suivre ma commande').
		await test.step("click track-order-button", async () => {
			await trackOrderButton.click();
		});

		await test.step("verify the URL becomes /account and the account/order area loads without error", async () => {
			await expect(page).toHaveURL(/\/account$/);
			await expect(
				page.getByRole("heading", { name: "Mon Compte" }),
			).toBeVisible();
		});
	});
});
