// spec: spec/authenticated-checkout.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Payment Step", () => {
	test("Payment step displays the correct total to pay matching the cart total", async ({
		page,
	}) => {
		// 1. Login, add product 1 and product 2 to the cart (total 289.98 €), navigate to /checkout, and submit the pre-filled shipping-form via shipping-submit-button.
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

		await test.step("add product 1 and product 2 to the cart", async () => {
			await page.getByTestId("nav-link-products").click();
			await page.getByTestId("add-to-cart-1").click();
			await expect(page.locator("[data-sonner-toast]")).toContainText(
				"Écouteurs Sans Fil Pro ajouté au panier",
			);
			await expect(page.getByTestId("cart-count")).toHaveText("1");

			await page.getByTestId("add-to-cart-2").click();
			await expect(page.getByTestId("cart-count")).toHaveText("2");
		});

		let cartTotalText = "";
		await test.step("navigate to /checkout and read the cart Récapitulatif total", async () => {
			await page.getByTestId("cart-link").click();

			const summary = page
				.getByRole("heading", { name: "Récapitulatif" })
				.locator("..");
			await expect(summary).toContainText("Sous-total (2 articles)");
			await expect(summary).toContainText("289.98 €");

			const cartTotal = page
				.getByText("Total", { exact: true })
				.locator("xpath=following-sibling::*[1]");
			cartTotalText = await cartTotal.innerText();

			await page.getByTestId("checkout-button").click();
		});

		await test.step("submit the pre-filled shipping-form via shipping-submit-button", async () => {
			await expect(page.getByTestId("shipping-form")).toBeVisible();
			await expect(page.getByTestId("shipping-form")).toBeVisible();
			await expect(page.getByTestId("shipping-firstname-input")).not.toHaveValue("");
			await page.getByTestId("shipping-submit-button").click();
		});

		// expect: Now on the Paiement step
		await test.step("verify now on the Paiement step", async () => {
			await expect(page.getByText("Paiement", { exact: true })).toBeVisible();
			await expect(page.getByTestId("payment-form")).toBeVisible();
		});

		// 2. Read the 'Total à payer' value and the payment-submit-button label.
		await test.step("read the Total à payer value and payment-submit-button label", async () => {
			const totalAPayer = page
				.getByText("Total à payer", { exact: true })
				.locator("xpath=following-sibling::*[1]");

			// expect: Both display 289.98 €, matching the cart Récapitulatif total from the cart page
			await expect(totalAPayer).toHaveText("289.98 €");
			await expect(totalAPayer).toHaveText(cartTotalText);
			await expect(
				page.getByTestId("payment-submit-button"),
			).toHaveText(`Payer ${cartTotalText}`);
		});
	});
});
