import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Clearing the entire cart empties it immediately", async ({ page }) => {
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

		await expect(
			page.getByRole("heading", {
				name: "Écouteurs Sans Fil Pro",
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1", exact: true }),
		).toBeVisible();
		const clearCartButton = page.getByTestId("clear-cart-button");
		await expect(clearCartButton).toBeVisible();

		await test.step("clear the cart", async () => {
			await clearCartButton.click();
		});
		// expect: No confirmation dialog appears
		// expect: The cart immediately shows the empty state: heading 'Votre panier est vide' with a 'Voir les produits' link
		await expect(
			page.getByRole("heading", { name: "Votre panier est vide" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Voir les produits" }),
		).toBeVisible();

		// expect: Header cart-count badge is no longer shown (or shows no count)
		await expect(page.getByTestId("cart-count")).toBeHidden();
	});
});
