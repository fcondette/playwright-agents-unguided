// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Payment Step", () => {
	test('"Retour au panier" link on the payment step goes back to the cart, not to the Livraison form', async ({
		page,
	}) => {
		// 1. Login, add product 1 to the cart, navigate to /checkout, and submit the pre-filled shipping-form to reach the Paiement step.
		await page.getByTestId("cart-link").click();
		await page.getByTestId("checkout-button").click();
		await page.getByTestId("shipping-submit-button").click();
		await expect(page.getByTestId("payment-form")).toBeVisible();
		const backLink = page.getByTestId("checkout-back-link");
		await expect(backLink).toBeVisible();

		// 2. Click checkout-back-link.
		await backLink.click();
		await expect(page).toHaveURL(/\/cart$/);
		await expect(
			page.getByRole("heading", { name: "Écouteurs Sans Fil Pro" }),
		).toBeVisible();
		await expect(page.getByText("Sous-total (1 article)")).toBeVisible();
		await expect(
			page.getByText("Total", { exact: true }).locator("..").getByText("199.99 €"),
		).toBeVisible();
	});
});
