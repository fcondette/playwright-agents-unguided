// spec: spec/authenticated-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Payment Step", () => {
	test("Submitting a complete payment form places the order and proceeds to Confirmation", async ({
		page,
	}) => {
		// 1. Login, add product 2 ('Hub USB-C 12-en-1') to the cart, navigate to /checkout, submit the pre-filled shipping-form.
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

		await test.step("add product 2 (Hub USB-C 12-en-1) to the cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByTestId("add-to-cart-2").click();
			await expect(page.locator("[data-sonner-toast]")).toContainText(
				"Hub USB-C 12-en-1 ajouté au panier",
			);
			await expect(page.getByTestId("cart-count")).toHaveText("1");
		});

		await test.step("navigate to /checkout and submit the pre-filled shipping-form", async () => {
			await page.getByTestId("cart-link").click();
			await page.getByTestId("checkout-button").click();

			const shippingForm = page.getByTestId("shipping-form");
			await expect(shippingForm).toBeVisible();
			await page.getByTestId("shipping-submit-button").click();
		});

		// expect: Paiement step is active
		const paiementStepLabel = page.getByText("Paiement", { exact: true });
		await expect(paiementStepLabel).toBeVisible();
		await expect(paiementStepLabel.locator("xpath=..")).toHaveClass(
			/bg-primary/,
		);

		const paymentForm = page.getByTestId("payment-form");
		await expect(paymentForm).toBeVisible();

		// 2. Fill payment-cardnumber-input with '4242424242424242', payment-cardname-input with 'Test User', payment-expiry-input with '12/28', and payment-cvv-input with '123'.
		const cardNumberInput = page.getByTestId("payment-cardnumber-input");
		const cardNameInput = page.getByTestId("payment-cardname-input");
		const expiryInput = page.getByTestId("payment-expiry-input");
		const cvvInput = page.getByTestId("payment-cvv-input");

		await cardNumberInput.fill("4242424242424242");
		await cardNameInput.fill("Test User");
		await expiryInput.fill("12/28");
		await cvvInput.fill("123");

		// expect: All fields show the entered values
		await expect(cardNumberInput).toHaveValue("4242424242424242");
		await expect(cardNameInput).toHaveValue("Test User");
		await expect(expiryInput).toHaveValue("12/28");
		await expect(cvvInput).toHaveValue("123");

		// 3. Click payment-submit-button ('Payer 89.99 €').
		await expect(page.getByTestId("payment-submit-button")).toHaveText(
			"Payer 89.99 €",
		);
		await page.getByTestId("payment-submit-button").click();

		// expect: The order is placed and the Confirmation step becomes active
		await expect(
			page.getByRole("heading", { name: "Commande confirmée !" }),
		).toBeVisible();
		await expect(page.getByTestId("order-confirmation-card")).toBeVisible();

		const confirmationStepLabel = page.getByText("Confirmation", {
			exact: true,
		});
		await expect(confirmationStepLabel).toBeVisible();
		await expect(confirmationStepLabel.locator("xpath=..")).toHaveClass(
			/bg-primary/,
		);
	});
});
