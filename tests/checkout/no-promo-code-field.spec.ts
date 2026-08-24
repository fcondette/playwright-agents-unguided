// spec: spec/authenticated-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Edge Cases and Price Recalculation", () => {
	test("No promo/discount code option is available in the cart or checkout", async ({
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

		await test.step("add product to cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByRole("link", { name: "Écouteurs Sans Fil Pro" }).click();
			await page.getByTestId("product-detail-add-to-cart").click();
			await expect(page.locator("[data-sonner-toast]")).toContainText(
				"Écouteurs Sans Fil Pro ajouté au panier",
			);
			await expect(page.getByTestId("cart-count")).toHaveText("1");
		});

		const promoCodeText = page.getByText(/code promo|réduction|coupon/i);

		// 1. Login, add a product to the cart, navigate to /cart via cart-link.
		await page.getByTestId("cart-link").click();
		await expect(
			page.getByRole("heading", { name: "Récapitulatif" }),
		).toBeVisible();
		await expect(promoCodeText).toHaveCount(0);

		const cartTotal = page
			.getByText("Total", { exact: true })
			.locator("xpath=following-sibling::*[1]");
		await expect(cartTotal).toHaveText("199.99 €");

		// 2. Proceed to /checkout and inspect both the Livraison and Paiement steps.
		await page.getByRole("link", { name: "Passer au paiement" }).click();
		await expect(
			page.getByRole("heading", { name: "Adresse de livraison" }),
		).toBeVisible();
		await expect(promoCodeText).toHaveCount(0);

		const livraisonTotal = page
			.getByText("Total", { exact: true })
			.locator("xpath=following-sibling::*[1]");
		await expect(livraisonTotal).toHaveText("199.99 €");

		await page.getByTestId("shipping-submit-button").click();
		await expect(
			page.getByRole("heading", { name: "Paiement sécurisé" }),
		).toBeVisible();
		await expect(promoCodeText).toHaveCount(0);
		await expect(page.getByText("199.99 €", { exact: true })).toBeVisible();
	});
});
