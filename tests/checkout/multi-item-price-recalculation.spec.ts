// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Edge Cases and Price Recalculation", () => {
	test("Adding multiple products with varying quantities recalculates totals correctly end-to-end through checkout", async ({
		page,
	}) => {
		// 1. Login, add product 1 ('Écouteurs Sans Fil Pro', 199.99 €) and product 2 ('Hub USB-C 12-en-1', 89.99 €) to the cart, navigate to /cart via cart-link.
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

		await page.getByTestId("nav-link-products").click();
		await page.getByTestId("add-to-cart-2").click();
		await expect(page.getByTestId("cart-count")).toHaveText("2");

		await page.getByTestId("cart-link").click();
		await expect(page).toHaveURL(/\/cart$/);

		const subtotalRow = page.getByText(/^Sous-total/).locator("..");
		const totalRow = page.getByText("Total", { exact: true }).locator("..");

		// expect: Récapitulatif shows Sous-total (2 articles) = 289.98 € and Total = 289.98 €
		await expect(subtotalRow).toContainText("Sous-total (2 articles)");
		await expect(subtotalRow).toContainText("289.98 €");
		await expect(totalRow).toContainText("289.98 €");

		// 2. Click increase-quantity-2 twice so product 2's quantity becomes 3 (3 x 89.99 € = 269.97 €).
		const quantity2 = page.getByTestId("quantity-2");
		const increaseQuantity2 = page.getByTestId("increase-quantity-2");
		// The line total paragraph is a sibling of the quantity controls group.
		const lineItemTotal2 = quantity2.locator("../..").locator("p");

		await increaseQuantity2.click();
		await increaseQuantity2.click();

		// expect: quantity-2 shows 3
		await expect(quantity2).toHaveText("3");

		// expect: Line total for product 2 shows 269.97 €
		await expect(lineItemTotal2).toHaveText("269.97 €");

		// expect: Récapitulatif shows Sous-total (4 articles) = 469.96 € and Total = 469.96 €
		await expect(subtotalRow).toContainText("Sous-total (4 articles)");
		await expect(subtotalRow).toContainText("469.96 €");
		await expect(totalRow).toContainText("469.96 €");

		// expect: Header cart-count shows 4
		await expect(page.getByTestId("cart-count")).toHaveText("4");

		// 3. Click checkout-button and submit the pre-filled shipping-form.
		await page.getByTestId("checkout-button").click();

		const shippingForm = page.getByTestId("shipping-form");
		await expect(shippingForm).toBeVisible();

		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(page.getByTestId("shipping-firstname-input")).not.toHaveValue("");
		await page.getByTestId("shipping-submit-button").click();

		// expect: Paiement step shows 'Total à payer' = 469.96 €, matching the cart total exactly
		const totalAPayer = page
			.getByText("Total à payer", { exact: true })
			.locator("xpath=following-sibling::*[1]");
		await expect(totalAPayer).toHaveText("469.96 €");

		// 4. Complete payment with valid test data and click payment-submit-button.
		await page
			.getByTestId("payment-cardnumber-input")
			.fill("4242424242424242");
		await page.getByTestId("payment-cardname-input").fill("Test User");
		await page.getByTestId("payment-expiry-input").fill("12/28");
		await page.getByTestId("payment-cvv-input").fill("123");
		await page.getByTestId("payment-submit-button").click();

		// expect: Confirmation step is reached, confirming the recalculated multi-item total was accepted and the order was placed
		await expect(
			page.getByRole("heading", { name: "Commande confirmée !" }),
		).toBeVisible();
	});
});
