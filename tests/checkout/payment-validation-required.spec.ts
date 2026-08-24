// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Payment Step", () => {
	test("Submitting the payment form with missing required fields is blocked", async ({
		page,
	}) => {
		// 1. Login, add a product to the cart, navigate to /checkout, submit the shipping-form to reach the Paiement step.
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

		await test.step("navigate to checkout and reach the Paiement step", async () => {
			await page.getByTestId("cart-link").click();
			await page.getByTestId("checkout-button").click();
			await page.getByTestId("shipping-submit-button").click();
		});

		const cardNumberInput = page.getByTestId("payment-cardnumber-input");
		const cardNameInput = page.getByTestId("payment-cardname-input");
		const expiryInput = page.getByTestId("payment-expiry-input");
		const cvvInput = page.getByTestId("payment-cvv-input");
		const paymentSubmitButton = page.getByTestId("payment-submit-button");

		await test.step("verify payment-form is visible with all fields empty", async () => {
			await expect(page.getByTestId("payment-form")).toBeVisible();
			await expect(cardNumberInput).toHaveValue("");
			await expect(cardNameInput).toHaveValue("");
			await expect(expiryInput).toHaveValue("");
			await expect(cvvInput).toHaveValue("");
		});

		// 2. Without filling any field, click payment-submit-button ('Payer {total} €').
		await test.step("click payment-submit-button without filling any field", async () => {
			await paymentSubmitButton.click();
		});

		await test.step("verify the order is not placed and the Paiement step remains active", async () => {
			await expect(page).toHaveURL(/\/checkout$/);
			await expect(page.getByTestId("payment-form")).toBeVisible();
		});

		await test.step("verify payment-cardnumber-input reports invalid via native HTML5 validation", async () => {
			const isValid = await cardNumberInput.evaluate(
				(el: HTMLInputElement) => el.validity.valid,
			);
			expect(isValid).toBe(false);
		});

		// 3. Fill only payment-cardnumber-input with a valid-looking number and click payment-submit-button again.
		await test.step("fill only payment-cardnumber-input with a valid-looking number", async () => {
			await cardNumberInput.fill("4242424242424242");
		});

		await test.step("click payment-submit-button again", async () => {
			await paymentSubmitButton.click();
		});

		await test.step("verify submission is still blocked because cardname, expiry and cvv remain empty and required", async () => {
			await expect(page).toHaveURL(/\/checkout$/);
			await expect(page.getByTestId("payment-form")).toBeVisible();

			const cardNameInvalid = await cardNameInput.evaluate(
				(el: HTMLInputElement) => el.validity.valid === false,
			);
			const expiryInvalid = await expiryInput.evaluate(
				(el: HTMLInputElement) => el.validity.valid === false,
			);
			const cvvInvalid = await cvvInput.evaluate(
				(el: HTMLInputElement) => el.validity.valid === false,
			);

			expect(cardNameInvalid).toBe(true);
			expect(expiryInvalid).toBe(true);
			expect(cvvInvalid).toBe(true);
		});
	});
});
