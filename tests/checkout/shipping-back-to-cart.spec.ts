// spec: spec/authenticated-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Shipping Address Step", () => {
	test('"Retour au panier" link on the shipping step returns to the cart without losing items', async ({
		page,
	}) => {
		// 1. Login, add product 1 to the cart, navigate to /checkout.
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
			page.getByText("Total", { exact: true }).locator("..").getByText("199.99 €"),
		).toBeVisible();
	});
});
