// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Shipping Address Step", () => {
	test("Shipping form is pre-filled with the authenticated user's saved address", async ({
		page,
	}) => {
		// 1. Login, add a product to the cart, and click through to /checkout via cart-link then checkout-button.
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

		// expect: shipping-firstname-input, shipping-lastname-input, shipping-email-input, shipping-phone-input, shipping-address-input, shipping-city-input and shipping-postalcode-input all contain non-empty, plausible values matching the logged-in user's profile
		await expect(page.getByTestId("shipping-firstname-input")).not.toHaveValue(
			"",
		);
		await expect(page.getByTestId("shipping-lastname-input")).not.toHaveValue(
			"",
		);
		await expect(page.getByTestId("shipping-email-input")).not.toHaveValue("");
		await expect(page.getByTestId("shipping-phone-input")).not.toHaveValue("");
		await expect(page.getByTestId("shipping-address-input")).not.toHaveValue(
			"",
		);
		await expect(page.getByTestId("shipping-city-input")).not.toHaveValue("");
		await expect(
			page.getByTestId("shipping-postalcode-input"),
		).not.toHaveValue("");

		// expect: shipping-email-input value equals the login email used
		await expect(page.getByTestId("shipping-email-input")).toHaveValue(email);
	});
});
