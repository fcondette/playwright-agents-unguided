import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Removing an item via the remove button deletes it immediately without confirmation", async ({
		page,
	}) => {
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
		await expect(page).toHaveURL(/\/cart$/);
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();

		// 2. Click remove-item-1.
		// expect: No confirmation dialog appears
		page.once("dialog", (dialog) => {
			throw new Error(
				`Unexpected confirmation dialog appeared: ${dialog.message()}`,
			);
		});
		await page.getByTestId("remove-item-1").click();

		// expect: The 'Écouteurs Sans Fil Pro' line item disappears immediately
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toHaveCount(0);

		// expect: Only 'Hub USB-C 12-en-1' remains, with Récapitulatif and cart-count reflecting 1 item / 89.99 €
		await expect(
			page.getByRole("heading", { name: "Hub USB-C 12-en-1" }),
		).toBeVisible();
		await expect(page.getByText("Sous-total (1 article)")).toBeVisible();
		await expect(page.getByText("289.98 €")).toHaveCount(0);
		await expect(page.getByText("199.99 €", { exact: true })).toHaveCount(0);
		await expect(page.getByTestId("cart-count")).toHaveText("1");
	});
});
