import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Shipping Address Step", () => {
	test('"Retour au panier" link on the shipping step returns to the cart without losing items', async ({
		page,
	}) => {
		// 1. Login, add product 1 to the cart, navigate to /checkout.

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

		await page.getByTestId("cart-link").click();
		await page.getByTestId("checkout-button").click();

		const shippingForm = page.getByTestId("shipping-form");
		await expect(shippingForm).toBeVisible();

		const backLink = page.getByTestId("checkout-back-link");
		await expect(backLink).toBeVisible();

		// 2. Click checkout-back-link.
		await backLink.click();
		await expect(page).toHaveURL(/\/cart$/);

		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(page.getByTestId("quantity-1")).toHaveText("1");
		await expect(page.getByText("Sous-total (1 article)")).toBeVisible();
		await expect(
			page
				.getByText("Total", { exact: true })
				.locator("..")
				.getByText("199.99 €"),
		).toBeVisible();
	});
});
