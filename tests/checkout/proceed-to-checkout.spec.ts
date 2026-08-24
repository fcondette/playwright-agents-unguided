// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Cart to Checkout Transition", () => {
	test("Proceeding from the cart opens the checkout shipping step", async ({
		page,
	}) => {
		// 1. Login, add product 2 ('Hub USB-C 12-en-1') to the cart, navigate to /cart via cart-link.
		await page.goto("/");
		await page.getByTestId("login-button").click();
		await page.getByTestId("login-email-input").fill(email);
		await page.getByTestId("login-password-input").fill(password);
		await page.getByTestId("login-submit-button").click();
		await expect(
			page.getByText("Connexion réussie", { exact: true }),
		).toBeVisible();

		await page.getByTestId("nav-link-products").click();
		await page.getByTestId("product-card-2").click();
		await page.getByTestId("product-detail-add-to-cart").click();
		await expect(page.locator("[data-sonner-toast]")).toContainText(
			"Hub USB-C 12-en-1 ajouté au panier",
		);

		await page.getByTestId("cart-link").click();

		// expect: Cart shows 1 item, checkout-button ('Passer au paiement') is visible
		await expect(page.getByTestId("cart-count")).toHaveText("1");
		await expect(
			page.getByText("Hub USB-C 12-en-1", { exact: true }),
		).toBeVisible();
		const checkoutButton = page.getByTestId("checkout-button");
		await expect(checkoutButton).toBeVisible();
		await expect(checkoutButton).toHaveText("Passer au paiement");

		// 2. Click checkout-button.
		await checkoutButton.click();

		// expect: URL becomes /checkout
		await expect(page).toHaveURL(/\/checkout$/);

		// expect: Progress indicator shows Livraison / Paiement / Confirmation with 'Livraison' as the active step
		const livraisonStep = page
			.getByRole("main")
			.getByText("Livraison", { exact: true });
		await expect(livraisonStep).toBeVisible();
		await expect(page.getByText("Paiement", { exact: true })).toBeVisible();
		await expect(page.getByText("Confirmation")).toBeVisible();
		await expect(livraisonStep.locator("..")).toHaveClass(/bg-primary/);

		// expect: shipping-form is visible with fields pre-filled from the authenticated user's saved profile
		await expect(page.getByTestId("shipping-form")).toBeVisible();
		await expect(page.getByTestId("shipping-firstname-input")).not.toBeEmpty();
		await expect(page.getByTestId("shipping-lastname-input")).not.toBeEmpty();
		await expect(page.getByTestId("shipping-email-input")).not.toBeEmpty();
		await expect(page.getByTestId("shipping-phone-input")).not.toBeEmpty();
		await expect(page.getByTestId("shipping-address-input")).not.toBeEmpty();
		await expect(page.getByTestId("shipping-city-input")).not.toBeEmpty();
		await expect(
			page.getByTestId("shipping-postalcode-input"),
		).not.toBeEmpty();

		// expect: An order recap panel shows 'Hub USB-C 12-en-1', 'Qté: 1', and Total 89.99 €
		const orderRecap = page.getByRole("heading", { name: "Récapitulatif" })
			.locator("..");
		await expect(
			orderRecap.getByText("Hub USB-C 12-en-1", { exact: true }),
		).toBeVisible();
		await expect(orderRecap.getByText("Qté: 1", { exact: true })).toBeVisible();
		await expect(
			orderRecap.getByText("Total").locator("..").getByText("89.99 €"),
		).toBeVisible();
	});
});
