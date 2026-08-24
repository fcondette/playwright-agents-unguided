// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Shipping Address Step", () => {
	test("Submitting the shipping form with a required field empty is blocked", async ({
		page,
	}) => {
		// 1. Login, add a product to the cart, navigate to /checkout.
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

		const livraisonStep = page.getByRole("main").getByText("Livraison", {
			exact: true,
		});
		const firstnameInput = page.getByTestId("shipping-firstname-input");
		const addressInput = page.getByTestId("shipping-address-input");
		const cityInput = page.getByTestId("shipping-city-input");
		const postalcodeInput = page.getByTestId("shipping-postalcode-input");
		const submitButton = page.getByTestId("shipping-submit-button");

		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(firstnameInput).not.toHaveValue("");
		await expect(page.getByTestId("shipping-lastname-input")).not.toHaveValue(
			"",
		);
		await expect(page.getByTestId("shipping-email-input")).not.toHaveValue(
			"",
		);
		await expect(page.getByTestId("shipping-phone-input")).not.toHaveValue(
			"",
		);
		await expect(addressInput).not.toHaveValue("");
		await expect(cityInput).not.toHaveValue("");
		await expect(postalcodeInput).not.toHaveValue("");

		const firstnameValue = await firstnameInput.inputValue();
		const addressValue = await addressInput.inputValue();
		const cityValue = await cityInput.inputValue();

		// 2. Clear shipping-firstname-input only (leave it empty) and click shipping-submit-button.
		await firstnameInput.fill("");
		await submitButton.click();

		await expect(livraisonStep).toBeVisible();
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(
			firstnameInput.evaluate((el: HTMLInputElement) => el.validity.valid),
		).resolves.toBe(false);

		// 3. Refill shipping-firstname-input with a valid value, then clear shipping-address-input only, and click shipping-submit-button again.
		await firstnameInput.fill(firstnameValue);
		await addressInput.fill("");
		await submitButton.click();

		await expect(livraisonStep).toBeVisible();
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(
			addressInput.evaluate((el: HTMLInputElement) => el.validity.valid),
		).resolves.toBe(false);

		// 4. Refill shipping-address-input, then clear shipping-city-input only, and click shipping-submit-button again.
		await addressInput.fill(addressValue);
		await cityInput.fill("");
		await submitButton.click();

		await expect(livraisonStep).toBeVisible();
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(
			cityInput.evaluate((el: HTMLInputElement) => el.validity.valid),
		).resolves.toBe(false);

		// 5. Refill shipping-city-input, then clear shipping-postalcode-input only, and click shipping-submit-button again.
		await cityInput.fill(cityValue);
		await postalcodeInput.fill("");
		await submitButton.click();

		await expect(livraisonStep).toBeVisible();
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(
			postalcodeInput.evaluate((el: HTMLInputElement) => el.validity.valid),
		).resolves.toBe(false);
	});
});
