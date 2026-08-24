// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart Viewing and Management", () => {
	test("Increasing item quantity updates line total and cart summary", async ({
		page,
	}) => {
		// 1. Login, add 'Écouteurs Sans Fil Pro' (product 1) to the cart, and navigate to /cart via cart-link.
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
		await expect(page).toHaveURL(/\/cart$/);

		const quantity1 = page.getByTestId("quantity-1");
		const increaseQuantity1 = page.getByTestId("increase-quantity-1");
		// The line total paragraph is a sibling of the quantity controls group.
		const lineItemTotal = quantity1.locator("../..").locator("p");
		const subtotalRow = page.getByText(/^Sous-total/).locator("..");
		const totalRow = page.getByText("Total", { exact: true }).locator("..");

		await expect(quantity1).toHaveText("1");
		await expect(lineItemTotal).toHaveText("199.99 €");

		// 2. Click increase-quantity-1 once.
		await increaseQuantity1.click();

		await expect(quantity1).toHaveText("2");
		await expect(lineItemTotal).toHaveText("399.98 €");
		await expect(subtotalRow).toContainText("Sous-total (2 articles)");
		await expect(subtotalRow).toContainText("399.98 €");
		await expect(totalRow).toContainText("399.98 €");
		await expect(page.getByTestId("cart-count")).toHaveText("2");

		// 3. Click increase-quantity-1 again.
		await increaseQuantity1.click();

		await expect(quantity1).toHaveText("3");
		await expect(lineItemTotal).toHaveText("599.97 €");
		await expect(subtotalRow).toContainText("Sous-total (3 articles)");
		await expect(subtotalRow).toContainText("599.97 €");
		await expect(totalRow).toContainText("599.97 €");
	});
});
