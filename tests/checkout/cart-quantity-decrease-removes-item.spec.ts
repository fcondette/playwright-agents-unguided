// spec: Cart Viewing and Management - Decreasing item quantity to zero removes the item from the cart
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Decreasing item quantity to zero removes the item from the cart", async ({
		page,
	}) => {
		// 1. Login, add both product 1 ('Écouteurs Sans Fil Pro') and product 2 ('Hub USB-C 12-en-1') to the cart, then navigate to /cart via cart-link.

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

		await test.step("add product 1 to the cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByRole("link", { name: "Écouteurs Sans Fil Pro" }).click();
			await page.getByTestId("product-detail-add-to-cart").click();
			await expect(page.getByTestId("cart-count")).toHaveText("1");
		});

		await test.step("add product 2 to the cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByRole("link", { name: "Hub USB-C 12-en-1" }).click();
			await page.getByTestId("product-detail-add-to-cart").click();

			await expect(page.getByTestId("cart-count")).toHaveText("2");
		});

		await page.getByTestId("cart-link").click();

		const cartCount = page.getByTestId("cart-count");

		await expect(
			page.getByRole("heading", {
				name: "Écouteurs Sans Fil Pro",
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1", exact: true }),
		).toBeVisible();
		await expect(cartCount).toHaveText("2");

		// 2. Click decrease-quantity-1 once (quantity was 1).
		await page.getByTestId("decrease-quantity-1").click();

		await expect(
			page.getByRole("heading", {
				name: "Écouteurs Sans Fil Pro",
				exact: true,
			}),
		).not.toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1", exact: true }),
		).toBeVisible();
		const subtotalRow = page.getByText("Sous-total (1 article)").locator("..");
		await expect(subtotalRow).toContainText("89.99 €");
		await expect(cartCount).toHaveText("1");
	});
});
