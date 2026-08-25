// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Order Confirmation", () => {
	test("Successful order placement shows a confirmation page with a unique order number and clears the cart", async ({
		page,
	}) => {
		// 1. Login, add a product to the cart, complete the shipping step (submit pre-filled shipping-form) and the payment step (fill payment-cardnumber-input, payment-cardname-input, payment-expiry-input, payment-cvv-input with valid test values and click payment-submit-button).
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
		await expect(page.getByTestId("cart-count")).toHaveText("1");

		await page.getByTestId("cart-link").click();
		await page.getByTestId("checkout-button").click();
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(page.getByTestId("shipping-firstname-input")).not.toHaveValue("");
		await page.getByTestId("shipping-submit-button").click();

		await page
			.getByTestId("payment-cardnumber-input")
			.fill("4242424242424242");
		await page.getByTestId("payment-cardname-input").fill("Test User");
		await page.getByTestId("payment-expiry-input").fill("12/28");
		await page.getByTestId("payment-cvv-input").fill("123");
		await page.getByTestId("payment-submit-button").click();

		const confirmationCard = page.getByTestId("order-confirmation-card");
		await expect(confirmationCard).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Commande confirmée !" }),
		).toBeVisible();
		await expect(
			page.getByText(
				"Merci pour votre commande. Vous recevrez un email de confirmation avec les détails de votre livraison.",
			),
		).toBeVisible();

		// 2. Read the order-number element.
		const orderNumber = page.getByTestId("order-number");
		await expect(orderNumber).toHaveText(/^#TH-[A-Z0-9]+$/);

		// 3. Inspect the header cart badge.
		await expect(page.getByTestId("cart-count")).not.toBeVisible();
	});
});
