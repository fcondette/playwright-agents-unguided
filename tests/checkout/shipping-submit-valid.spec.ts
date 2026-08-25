// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Shipping Address Step", () => {
	test("Submitting a complete shipping form proceeds to the Payment step", async ({
		page,
	}) => {
		// 1. Login, add a product to the cart, navigate to /checkout (cart-link then checkout-button).
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

		await page.getByTestId("cart-link").click();
		await page.getByTestId("checkout-button").click();

		const shippingForm = page.getByTestId("shipping-form");
		await expect(shippingForm).toBeVisible();
		await expect(page.getByLabel("Prénom")).not.toHaveValue("");
		await expect(page.getByLabel("Nom", { exact: true })).not.toHaveValue("");
		await expect(page.getByLabel("Email")).toHaveValue(email);
		await expect(page.getByLabel("Téléphone")).not.toHaveValue("");
		await expect(page.getByLabel("Adresse")).not.toHaveValue("");
		await expect(page.getByLabel("Ville")).not.toHaveValue("");
		await expect(page.getByLabel("Code postal")).not.toHaveValue("");

		const cartTotal = page
			.getByText("Total", { exact: true })
			.locator("xpath=following-sibling::*[1]");
		const cartTotalText = await cartTotal.innerText();

		// 2. Click shipping-submit-button ('Continuer vers le paiement') without changing any field.
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(page.getByTestId("shipping-firstname-input")).not.toHaveValue(
			"",
		);
		await page.getByTestId("shipping-submit-button").click();

		const paiementStepLabel = page.getByText("Paiement", { exact: true });
		await expect(paiementStepLabel).toBeVisible();
		await expect(paiementStepLabel.locator("xpath=..")).toHaveClass(
			/bg-primary/,
		);

		const paymentForm = page.getByTestId("payment-form");
		await expect(paymentForm).toBeVisible();
		await expect(page.getByTestId("payment-cardnumber-input")).toBeVisible();
		await expect(page.getByTestId("payment-cardname-input")).toBeVisible();
		await expect(page.getByTestId("payment-expiry-input")).toBeVisible();
		await expect(page.getByTestId("payment-cvv-input")).toBeVisible();
		await expect(page.getByTestId("payment-submit-button")).toBeVisible();

		const totalAPayer = page
			.getByText("Total à payer", { exact: true })
			.locator("xpath=following-sibling::*[1]");
		await expect(totalAPayer).toHaveText(cartTotalText);
	});
});
