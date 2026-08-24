# Authenticated Checkout Flow Test Plan

## Application Overview

TechHub (shop.missionplaywright.fr) is a French-language e-commerce site selling tech products (accessories, gaming, smart home, office). This plan covers the AUTHENTICATED CHECKOUT FLOW: from an authenticated user's cart through to a placed and confirmed order.

All tests assume a fresh browser context. Every test begins by reproducing the seed flow (tests/seed.spec.ts): navigate to "/", click `login-button`, fill `login-email-input` / `login-password-input`, click `login-submit-button`, assert "Connexion réussie" toast, then add product(s) to the cart via `nav-link-products` -> product link -> `product-detail-add-to-cart` (or the quicker `add-to-cart-{id}` button directly on the `/products` listing).

IMPORTANT TECHNICAL NOTE discovered during exploration: the cart is held in client-side React state only and is NOT persisted (no localStorage/cookie backing). A full page navigation/reload (`page.goto()`) resets the cart to empty. All in-flow navigation (product -> cart -> checkout, header links, step transitions) must therefore be performed via in-app UI clicks (`nav-link-products`, `cart-link`, "Passer au paiement" link, etc.), never via `page.goto()`, once items have been added to the cart. Testers/automation should keep this in mind: only the very first `page.goto("/")` in the seed step is a full navigation; everything afterwards must be clicks.

Key UI structure discovered:
- Header: `nav-link-home`, `nav-link-products`, `nav-link-about`, `nav-link-contact`, `search-button`, `cart-link` (wraps `cart-button` and a `cart-count` badge showing the sum of all item quantities), `user-menu-button` (opens "Mon compte" / "Déconnexion" menu).
- Product detail page: `product-detail-add-to-cart` (disabled with a "Rupture de stock" label when the product is out of stock, e.g. product id 12 "Casque VR Gaming").
- Product listing page (`/products`): `product-card-{id}`, `product-container-{id}`, `add-to-cart-{id}` (also disabled for out-of-stock products).
- Cart page (`/cart`): `clear-cart-button` ("Vider le panier"), per line item `remove-item-{id}`, `decrease-quantity-{id}`, `quantity-{id}` (text), `increase-quantity-{id}`; summary panel with subtotal ("Sous-total (N articles)"), "Livraison: Gratuite", "Total", "TVA incluse" note; `checkout-button` ("Passer au paiement" link to `/checkout`) and `continue-shopping-button` ("Continuer mes achats" link to `/products`). Empty cart shows heading "Votre panier est vide" instead of the cart contents, and this same empty state is shown if `/checkout` is reached directly with an empty cart (checkout is effectively blocked).
- Checkout page (`/checkout`) is a single-page, 3-step flow with a progress indicator (Livraison / Paiement / Confirmation):
  - Step 1 "Livraison": `checkout-back-link` ("Retour au panier"), `shipping-form` with `shipping-firstname-input`, `shipping-lastname-input`, `shipping-email-input`, `shipping-phone-input`, `shipping-address-input`, `shipping-city-input`, `shipping-postalcode-input` (all pre-filled from the authenticated user's saved profile), and `shipping-submit-button` ("Continuer vers le paiement"). Fields use native HTML5 `required` validation - clearing a required field and submitting keeps the user on step 1 (element `validity.valid` is `false`). A mini order recap (items + total) is shown alongside the form on this step.
  - Step 2 "Paiement": `payment-form` with `payment-cardnumber-input`, `payment-cardname-input`, `payment-expiry-input`, `payment-cvv-input`, and `payment-submit-button` ("Payer {total} €"); displays "Total à payer". Same native required-field validation applies. No visible card-number auto-formatting was observed. The upper-left link is still `checkout-back-link`, but on this step it goes straight back to `/cart` ("Retour au panier") - there is no link back to the Livraison (step 1) form; a user who wants to correct shipping details after reaching Paiement has no way to return to that form without leaving checkout and re-entering it (confirmed via manual exploration).
  - Step 3 "Confirmation": `order-confirmation-card` with heading "Commande confirmée !", an `order-number` in the format "#TH-XXXXXXXX", `track-order-button` ("Suivre ma commande" -> `/account`) and `continue-shopping-button` ("Continuer mes achats" -> `/products`). The cart is cleared automatically once the order is confirmed (cart badge disappears).
- No promo/discount code field was found anywhere in the cart or checkout UI - this is treated as an absent feature and covered by a negative test.
- Removing an item, decreasing a quantity to 0 (which removes the line entirely), and clearing the whole cart all happen immediately with no confirmation dialog.

## Test Scenarios

### 1. Cart Viewing and Management

**Seed:** `tests/seed.spec.ts`

#### 1.1. Cart displays correct items, quantities, and totals for multiple products

**File:** `tests/checkout/cart-view.spec.ts`

**Steps:**
  1. Reproduce the seed login flow (as in tests/seed.spec.ts).
    - expect: "Connexion réussie" toast is visible
  2. Click nav-link-products, then use add-to-cart-1 on the products listing to add 'Écouteurs Sans Fil Pro'.
    - expect: A toast confirms the product was added to the cart
    - expect: cart-count badge shows 1
  3. Use add-to-cart-2 on the products listing to add 'Hub USB-C 12-en-1'.
    - expect: cart-count badge shows 2
  4. Click cart-link to navigate to /cart (in-app click, not page.goto).
    - expect: Heading 'Votre Panier' is visible
    - expect: Two line items are listed: 'Écouteurs Sans Fil Pro' at 199.99 € / unité and 'Hub USB-C 12-en-1' at 89.99 € / unité
    - expect: quantity-1 and quantity-2 both show 1
    - expect: Récapitulatif shows 'Sous-total (2 articles)' = 289.98 €
    - expect: Livraison shows 'Gratuite'
    - expect: Total shows 289.98 € with 'TVA incluse' note

#### 1.2. Increasing item quantity updates line total and cart summary

**File:** `tests/checkout/cart-quantity-increase.spec.ts`

**Steps:**
  1. Login, add 'Écouteurs Sans Fil Pro' (product 1) to the cart, and navigate to /cart via cart-link.
    - expect: Cart shows 1 item with quantity-1 = 1 and line total 199.99 €
  2. Click increase-quantity-1 once.
    - expect: quantity-1 becomes 2
    - expect: Line total for the item becomes 399.98 €
    - expect: Récapitulatif subtotal/total updates to 'Sous-total (2 articles)' / 399.98 €
    - expect: Header cart-count badge updates to 2
  3. Click increase-quantity-1 again.
    - expect: quantity-1 becomes 3
    - expect: Totals recalculate accordingly (599.97 €)

#### 1.3. Decreasing item quantity to zero removes the item from the cart

**File:** `tests/checkout/cart-quantity-decrease-removes-item.spec.ts`

**Steps:**
  1. Login, add both product 1 ('Écouteurs Sans Fil Pro') and product 2 ('Hub USB-C 12-en-1') to the cart, then navigate to /cart via cart-link.
    - expect: Both line items are present, cart-count shows 2
  2. Click decrease-quantity-1 once (quantity was 1).
    - expect: The 'Écouteurs Sans Fil Pro' line item is removed entirely from the cart (no zero-quantity row remains)
    - expect: Only the Hub USB-C line item remains
    - expect: Récapitulatif shows 'Sous-total (1 article)' = 89.99 €
    - expect: Header cart-count badge updates to 1

#### 1.4. Removing an item via the remove button deletes it immediately without confirmation

**File:** `tests/checkout/cart-remove-item.spec.ts`

**Steps:**
  1. Login, add product 1 and product 2 to the cart, navigate to /cart via cart-link.
    - expect: Both items are listed
  2. Click remove-item-1.
    - expect: No confirmation dialog appears
    - expect: The 'Écouteurs Sans Fil Pro' line item disappears immediately
    - expect: Only 'Hub USB-C 12-en-1' remains, with Récapitulatif and cart-count reflecting 1 item / 89.99 €

#### 1.5. Clearing the entire cart empties it immediately

**File:** `tests/checkout/cart-clear-all.spec.ts`

**Steps:**
  1. Login, add product 1 and product 2 to the cart, navigate to /cart via cart-link.
    - expect: Two line items are visible and clear-cart-button ('Vider le panier') is visible
  2. Click clear-cart-button.
    - expect: No confirmation dialog appears
    - expect: The cart immediately shows the empty state: heading 'Votre panier est vide' with a 'Voir les produits' link
    - expect: Header cart-count badge is no longer shown (or shows no count)

#### 1.6. Empty cart shows an empty state and offers no checkout action

**File:** `tests/checkout/cart-empty-state.spec.ts`

**Steps:**
  1. Login only (do not add any product to the cart) and click cart-link to navigate to /cart.
    - expect: Heading 'Votre panier est vide' is visible
    - expect: Text 'Découvrez notre catalogue et ajoutez des produits à votre panier.' is visible
    - expect: A 'Voir les produits' button/link to /products is visible
    - expect: No 'Passer au paiement' checkout button is present

### 2. Cart to Checkout Transition

**Seed:** `tests/seed.spec.ts`

#### 2.1. Proceeding from the cart opens the checkout shipping step

**File:** `tests/checkout/proceed-to-checkout.spec.ts`

**Steps:**
  1. Login, add product 2 ('Hub USB-C 12-en-1') to the cart, navigate to /cart via cart-link.
    - expect: Cart shows 1 item, checkout-button ('Passer au paiement') is visible
  2. Click checkout-button.
    - expect: URL becomes /checkout
    - expect: Progress indicator shows Livraison / Paiement / Confirmation with 'Livraison' as the active step
    - expect: shipping-form is visible with fields pre-filled from the authenticated user's saved profile (firstname, lastname, email, phone, address, city, postal code all non-empty)
    - expect: An order recap panel shows 'Hub USB-C 12-en-1', 'Qté: 1', and Total 89.99 €

#### 2.2. Direct navigation to /checkout with an empty cart is blocked

**File:** `tests/checkout/checkout-blocked-empty-cart.spec.ts`

**Steps:**
  1. Login only, ensure the cart is empty (do not add products), then navigate directly to /checkout.
    - expect: The checkout page shows the empty-cart state (heading 'Votre panier est vide') instead of the shipping-form
    - expect: No shipping/payment fields are rendered
    - expect: A link back to /products ('Voir les produits') is shown

#### 2.3. "Continuer mes achats" from the cart returns to the products page without losing prior selections

**File:** `tests/checkout/cart-continue-shopping.spec.ts`

**Steps:**
  1. Login, add product 1 to the cart, navigate to /cart via cart-link.
    - expect: cart-count shows 1
  2. Click continue-shopping-button ('Continuer mes achats').
    - expect: URL becomes /products
    - expect: Header cart-count badge still shows 1 (cart contents preserved by the in-app navigation)

### 3. Shipping Address Step

**Seed:** `tests/seed.spec.ts`

#### 3.1. Shipping form is pre-filled with the authenticated user's saved address

**File:** `tests/checkout/shipping-prefill.spec.ts`

**Steps:**
  1. Login, add a product to the cart, and click through to /checkout via cart-link then checkout-button.
    - expect: shipping-firstname-input, shipping-lastname-input, shipping-email-input, shipping-phone-input, shipping-address-input, shipping-city-input and shipping-postalcode-input all contain non-empty, plausible values matching the logged-in user's profile
    - expect: shipping-email-input value equals the login email used

#### 3.2. Submitting a complete shipping form proceeds to the Payment step

**File:** `tests/checkout/shipping-submit-valid.spec.ts`

**Steps:**
  1. Login, add a product to the cart, navigate to /checkout (cart-link then checkout-button).
    - expect: shipping-form is visible with pre-filled valid data
  2. Click shipping-submit-button ('Continuer vers le paiement') without changing any field.
    - expect: Progress indicator now highlights 'Paiement' as the active step
    - expect: payment-form is visible with payment-cardnumber-input, payment-cardname-input, payment-expiry-input, payment-cvv-input, and payment-submit-button
    - expect: 'Total à payer' matches the cart total

#### 3.3. Submitting the shipping form with a required field empty is blocked

**File:** `tests/checkout/shipping-validation-required.spec.ts`

**Steps:**
  1. Login, add a product to the cart, navigate to /checkout.
    - expect: shipping-form is visible with all fields pre-filled
  2. Clear shipping-firstname-input only (leave it empty) and click shipping-submit-button.
    - expect: The page does NOT advance to the Paiement step; 'Livraison' remains the active step
    - expect: shipping-firstname-input reports invalid via the browser's native HTML5 validation (element.validity.valid === false)
  3. Refill shipping-firstname-input with a valid value, then clear shipping-address-input only, and click shipping-submit-button again.
    - expect: Submission is blocked and the user stays on the Livraison step
    - expect: shipping-address-input reports invalid (validity.valid === false)
  4. Refill shipping-address-input, then clear shipping-city-input only, and click shipping-submit-button again.
    - expect: Submission is blocked and the user stays on the Livraison step
    - expect: shipping-city-input reports invalid (validity.valid === false)
  5. Refill shipping-city-input, then clear shipping-postalcode-input only, and click shipping-submit-button again.
    - expect: Submission is blocked and the user stays on the Livraison step
    - expect: shipping-postalcode-input reports invalid (validity.valid === false)

#### 3.4. "Retour au panier" link on the shipping step returns to the cart without losing items

**File:** `tests/checkout/shipping-back-to-cart.spec.ts`

**Steps:**
  1. Login, add product 1 to the cart, navigate to /checkout.
    - expect: shipping-form is visible, checkout-back-link ('Retour au panier') is visible
  2. Click checkout-back-link.
    - expect: URL becomes /cart
    - expect: The previously added item is still present in the cart with the same quantity and total

### 4. Payment Step

**Seed:** `tests/seed.spec.ts`

#### 4.1. Payment step displays the correct total to pay matching the cart total

**File:** `tests/checkout/payment-total-matches-cart.spec.ts`

**Steps:**
  1. Login, add product 1 and product 2 to the cart (total 289.98 €), navigate to /checkout, and submit the pre-filled shipping-form via shipping-submit-button.
    - expect: Now on the Paiement step
  2. Read the 'Total à payer' value and the payment-submit-button label.
    - expect: Both display 289.98 €, matching the cart Récapitulatif total from the cart page

#### 4.2. Submitting the payment form with missing required fields is blocked

**File:** `tests/checkout/payment-validation-required.spec.ts`

**Steps:**
  1. Login, add a product to the cart, navigate to /checkout, submit the shipping-form to reach the Paiement step.
    - expect: payment-form is visible with all fields empty
  2. Without filling any field, click payment-submit-button ('Payer {total} €').
    - expect: The order is NOT placed; the Paiement step remains active
    - expect: payment-cardnumber-input reports invalid via native HTML5 validation (validity.valid === false)
  3. Fill only payment-cardnumber-input with a valid-looking number (e.g. 4242424242424242) and click payment-submit-button again.
    - expect: Submission is still blocked because payment-cardname-input, payment-expiry-input and payment-cvv-input remain empty and required

#### 4.3. "Retour au panier" link on the payment step goes back to the cart, not to the Livraison form

**File:** `tests/checkout/payment-back-link-goes-to-cart.spec.ts`

**Steps:**
  1. Login, add product 1 to the cart, navigate to /checkout, and submit the pre-filled shipping-form to reach the Paiement step.
    - expect: payment-form is visible; checkout-back-link is visible in the upper-left corner
  2. Click checkout-back-link.
    - expect: URL becomes /cart (there is no intermediate return to the Livraison/shipping form - checkout-back-link on this step skips step 1 entirely)
    - expect: The previously added item is still present in the cart with the same quantity and total

#### 4.4. Submitting a complete payment form places the order and proceeds to Confirmation

**File:** `tests/checkout/payment-submit-valid.spec.ts`

**Steps:**
  1. Login, add product 2 ('Hub USB-C 12-en-1') to the cart, navigate to /checkout, submit the pre-filled shipping-form.
    - expect: Paiement step is active
  2. Fill payment-cardnumber-input with '4242424242424242', payment-cardname-input with 'Test User', payment-expiry-input with '12/28', and payment-cvv-input with '123'.
    - expect: All fields show the entered values
  3. Click payment-submit-button ('Payer 89.99 €').
    - expect: The order is placed and the Confirmation step becomes active

### 5. Order Confirmation

**Seed:** `tests/seed.spec.ts`

#### 5.1. Successful order placement shows a confirmation page with a unique order number and clears the cart

**File:** `tests/checkout/order-confirmation.spec.ts`

**Steps:**
  1. Login, add a product to the cart, complete the shipping step (submit pre-filled shipping-form) and the payment step (fill payment-cardnumber-input, payment-cardname-input, payment-expiry-input, payment-cvv-input with valid test values and click payment-submit-button).
    - expect: order-confirmation-card is visible
    - expect: Heading 'Commande confirmée !' is visible
    - expect: Confirmation text mentions an email will be sent with delivery details
  2. Read the order-number element.
    - expect: order-number text matches the pattern '#TH-' followed by an alphanumeric identifier (e.g. #TH-6ADAE6F5)
  3. Inspect the header cart badge.
    - expect: cart-count / cart-button no longer show any item count - the cart has been cleared after the order was placed

#### 5.2. Two consecutive orders each receive a distinct order number

**File:** `tests/checkout/order-number-uniqueness.spec.ts`

**Steps:**
  1. Login, add a product to the cart and complete checkout (shipping + valid payment) to reach the Confirmation step.
    - expect: order-confirmation-card is visible with an order-number, e.g. ORDER_1
  2. Click continue-shopping-button to return to /products, add a product to the cart again, and complete checkout a second time (shipping + valid payment).
    - expect: A second order-confirmation-card is shown with an order-number, e.g. ORDER_2
  3. Compare ORDER_1 and ORDER_2.
    - expect: The two order numbers are different from each other

#### 5.3. "Continuer mes achats" on the confirmation page navigates to the products page

**File:** `tests/checkout/confirmation-continue-shopping.spec.ts`

**Steps:**
  1. Login, add a product to the cart and complete checkout (shipping + valid payment) to reach the Confirmation step.
    - expect: order-confirmation-card is visible
  2. Click continue-shopping-button on the confirmation page.
    - expect: URL becomes /products
    - expect: The products listing is displayed and the header cart badge shows no items

#### 5.4. "Suivre ma commande" on the confirmation page navigates to the account/order tracking page

**File:** `tests/checkout/confirmation-track-order.spec.ts`

**Steps:**
  1. Login, add a product to the cart and complete checkout (shipping + valid payment) to reach the Confirmation step.
    - expect: order-confirmation-card and track-order-button are visible
  2. Click track-order-button ('Suivre ma commande').
    - expect: URL becomes /account
    - expect: The account/order area loads without error (e.g. the page does not show a 404 or blank error state)

### 6. Edge Cases and Price Recalculation

**Seed:** `tests/seed.spec.ts`

#### 6.1. Out-of-stock product cannot be added to the cart from the detail page or the listing page

**File:** `tests/checkout/out-of-stock-product.spec.ts`

**Steps:**
  1. Login, click nav-link-products, and locate product 12 'Casque VR Gaming' on the /products listing.
    - expect: Its add-to-cart-12 button is disabled
    - expect: The card text includes 'Rupture de stock'
  2. Navigate to the product detail page /product/12 via clicking its card link.
    - expect: The paragraph 'Rupture de stock' is displayed
    - expect: The product-detail-add-to-cart button reports disabled (toBeDisabled)
    - expect: No 'ajouté au panier' toast appears and the header cart-count remains unchanged, confirming the disabled control cannot be used to add the out-of-stock item to the cart

#### 6.2. Adding multiple products with varying quantities recalculates totals correctly end-to-end through checkout

**File:** `tests/checkout/multi-item-price-recalculation.spec.ts`

**Steps:**
  1. Login, add product 1 ('Écouteurs Sans Fil Pro', 199.99 €) and product 2 ('Hub USB-C 12-en-1', 89.99 €) to the cart, navigate to /cart via cart-link.
    - expect: Récapitulatif shows Sous-total (2 articles) = 289.98 € and Total = 289.98 €
  2. Click increase-quantity-2 twice so product 2's quantity becomes 3 (3 x 89.99 € = 269.97 €).
    - expect: quantity-2 shows 3
    - expect: Line total for product 2 shows 269.97 €
    - expect: Récapitulatif shows Sous-total (4 articles) = 469.96 € and Total = 469.96 €
    - expect: Header cart-count shows 4
  3. Click checkout-button and submit the pre-filled shipping-form.
    - expect: Paiement step shows 'Total à payer' = 469.96 €, matching the cart total exactly
  4. Complete payment with valid test data and click payment-submit-button.
    - expect: Confirmation step is reached, confirming the recalculated multi-item total was accepted and the order was placed

#### 6.3. No promo/discount code option is available in the cart or checkout

**File:** `tests/checkout/no-promo-code-field.spec.ts`

**Steps:**
  1. Login, add a product to the cart, navigate to /cart via cart-link.
    - expect: No input field, label or button referencing a promo/discount/coupon code (e.g. 'code promo', 'réduction') is present anywhere on the cart page
  2. Proceed to /checkout and inspect both the Livraison and Paiement steps.
    - expect: Neither step exposes a promo/discount code field
    - expect: The Total shown never changes due to any such code since no such feature exists
