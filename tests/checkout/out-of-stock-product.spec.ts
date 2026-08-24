// spec: Edge Cases and Price Recalculation
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Edge Cases and Price Recalculation", () => {
	test("Out-of-stock product cannot be added to the cart from the detail page or the listing page", async ({
		page,
	}) => {
		// 1. Login, click nav-link-products, and locate product 12 'Casque VR Gaming' on the /products listing.
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();
		await page.getByTestId("nav-link-products").click();

		const productCard12 = page.getByTestId("product-card-12");

		// expect: Its add-to-cart-12 button is disabled
		await expect(page.getByTestId("add-to-cart-12")).toBeDisabled();

		// expect: The card text includes 'Rupture de stock'
		await expect(productCard12).toContainText("Rupture de stock");

		// 2. Navigate to the product detail page /product/12 via clicking its card link.
		await productCard12.click();

		// expect: The paragraph 'Rupture de stock' is displayed
		await expect(page.getByText("Rupture de stock")).toBeVisible();

		// expect: The product-detail-add-to-cart button reports disabled (toBeDisabled)
		await expect(
			page.getByTestId("product-detail-add-to-cart"),
		).toBeDisabled();

		// expect: No 'ajouté au panier' toast appears and the header cart-count remains unchanged, confirming the disabled control cannot be used to add the out-of-stock item to the cart
		await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
		await expect(page.getByTestId("cart-count")).not.toBeVisible();
	});
});
