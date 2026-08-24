> ARCHIVED. Generated on a blank-slate run before the seed was
> authenticated. Guest checkout does not exist on this application;
> the plan's own exploration notes explain why. Kept as a record of
> planner behaviour when asked for a non-existent flow.

# TechHub Guest Checkout Flow - Test Plan

## Application Overview

This test plan covers the guest (non-authenticated) shopping and checkout flow on the TechHub demo shop (https://shop.missionplaywright.fr).

IMPORTANT DISCOVERY FROM EXPLORATION: The application, in its current state, does NOT offer a true "guest checkout" path. Browsing the catalog and managing the cart (add/update quantity/remove/clear) work fully without an account. However, navigating to /checkout — regardless of whether the cart has items or is empty — always renders a "Connexion requise" (Login required) screen with only two options: "Se connecter" (Log in, linking to /auth) and "Retour au panier" (Back to cart). The /auth page itself only exposes "Connexion" (Login) and "Inscription" (Sign up) tabs; no "Continue as guest" / "Continuer sans compte" option exists anywhere in the cart, checkout, or auth screens. No shipping-method selector, payment form, promo/coupon code field, or order-review/confirmation step is ever reached by an unauthenticated user, because the account gate blocks access before any of that UI is rendered. The cart itself also has no visible coupon/promo code input field.

Given this, the plan is split into two parts:

1. Tests for the parts of the guest experience that ARE implemented and testable: catalog browsing, add-to-cart, cart quantity editing, item removal, cart clearing, out-of-stock handling, and cart-state persistence behavior across reloads.
2. Tests that specifically probe and document the guest-checkout gating behavior described above (the "Connexion requise" wall), including confirming there is no bypass, that cart contents survive the round trip to the gate and back, and that no checkout sub-steps (shipping/payment/promo/review) are ever exposed pre-authentication.

Any future test relying on filling a guest shipping/billing/payment form or applying a promo code at checkout is currently BLOCKED by this login requirement; those scenarios are represented here as gating/negative tests rather than as completed-form scenarios, per actual observed behavior. If the application is later updated to add a genuine guest-checkout option, these tests (especially Suite B) should be revisited and expanded with the form-filling, shipping-selection, payment-entry, and order-review scenarios originally requested.

Key facts observed during exploration:

- Homepage: / ; Catalog: /products (supports category query param, sort dropdown, list/grid toggle, "Filtres" button); Product detail: /product/{id}; Cart: /cart; Checkout: /checkout (login-gated); Auth: /auth (Connexion / Inscription tabs).
- Add-to-cart button on product detail page: data-testid "product-detail-add-to-cart"; disabled and cart badge unaffected when product is out of stock (example: /product/12 "Casque VR Gaming", labeled "Rupture de stock").
- Header cart icon links to /cart and shows a numeric badge of item count once non-empty.
- Cart line items have quantity decrease/increase controls (data-testid pattern "decrease-quantity-{id}" / "increase-quantity-{id}") and a per-item remove control; decreasing quantity from 1 to 0 removes the item entirely. A "Vider le panier" button clears the whole cart. Order summary shows Sous-total, Livraison (Gratuite), Total, and a "Passer au paiement" button/link to /checkout, plus a "Continuer mes achats" link back to /products.
- Cart state appears to be held only in client-side (in-memory) state: a full page reload or direct URL navigation (e.g., typing /cart or /product/x in the address bar, or Playwright's page.goto) resets the cart to empty, whereas SPA link clicks preserve it.
- No promo/coupon code field is present anywhere in the observed guest flow.

## Test Scenarios

### 1. Guest Browsing and Cart Management

**Seed:** `spec/guest-checkout.plan.md`

#### 1.1. Guest can browse catalog and add a product to the cart

**File:** `tests/guest-checkout/add-to-cart.spec.ts`

**Steps:**

1. Start from a fresh session with an empty cart and no logged-in user. Navigate to the homepage (/).


    - expect: Homepage loads successfully

2. Click 'Produits' nav link to go to the catalog (/products).


    - expect: Catalog page loads listing multiple product cards

3. Click on a product card, e.g. 'Écouteurs Sans Fil Pro', to open its product detail page (/product/1).


    - expect: Product detail page loads showing name, price, description, characteristics, stock status ('En stock - Expédition sous 24h'), and an enabled 'Ajouter au panier' button

4. Click the 'Ajouter au panier' button.


    - expect: The header cart icon badge updates to show a count of 1
    - expect: No page navigation occurs (stays on product detail page)

5. Click the cart icon in the header to navigate to /cart.


    - expect: Cart page shows the added product with correct name, unit price, quantity of 1, and line total
    - expect: Order summary ('Récapitulatif') shows correct Sous-total, 'Livraison: Gratuite', and Total matching the item price

#### 1.2. Guest can add multiple different products and see correct cart totals

**File:** `tests/guest-checkout/add-multiple-products.spec.ts`

**Steps:**

1. Starting from a fresh session, navigate to /product/1 and click 'Ajouter au panier'.


    - expect: Cart badge shows 1

2. Navigate via the catalog (SPA link clicks, not direct URL) to /product/2 (Hub USB-C 12-en-1) and click 'Ajouter au panier'.


    - expect: Cart badge shows 2

3. Open the cart page via the header cart icon.


    - expect: Both products are listed as separate line items with correct unit prices and quantities of 1 each
    - expect: Sous-total equals the sum of both product prices
    - expect: Total equals Sous-total (shipping is free) and 'TVA incluse' note is shown

#### 1.3. Guest can increase and decrease item quantity in the cart

**File:** `tests/guest-checkout/update-quantity.spec.ts`

**Steps:**

1. Starting from a fresh session, add one product to the cart and open the cart page (via SPA navigation).


    - expect: Cart page shows the item with quantity 1

2. Click the quantity increase (+) control on the item twice.


    - expect: Displayed quantity increases to 3
    - expect: Line item total price updates to unit price x 3
    - expect: Cart summary Sous-total and Total update accordingly
    - expect: Header cart badge updates to reflect the new total item count

3. Click the quantity decrease (-) control once.


    - expect: Quantity decreases to 2 and all totals update accordingly

#### 1.4. Decreasing quantity to zero removes the item and empties the cart

**File:** `tests/guest-checkout/decrease-to-zero.spec.ts`

**Steps:**

1. Starting from a fresh session, add a single product (quantity 1) to the cart and open the cart page.


    - expect: Cart page shows exactly one line item with quantity 1

2. Click the quantity decrease (-) control once on the sole item.


    - expect: The item is removed from the cart
    - expect: The page shows the empty-cart state: heading 'Votre panier est vide' with message 'Découvrez notre catalogue et ajoutez des produits à votre panier.' and a 'Voir les produits' button
    - expect: The header cart icon badge no longer shows a count

#### 1.5. Guest can remove a specific item from a multi-item cart

**File:** `tests/guest-checkout/remove-item.spec.ts`

**Steps:**

1. Starting from a fresh session, add two different products to the cart and open the cart page.


    - expect: Cart page shows two distinct line items

2. Locate and click the remove/delete control (icon button near the item title) for one of the two items.


    - expect: Only the removed product's line item disappears from the cart
    - expect: The remaining item stays with its original quantity and price
    - expect: Cart summary totals update to reflect only the remaining item
    - expect: Header cart badge count decreases accordingly

#### 1.6. Guest can clear the entire cart using 'Vider le panier'

**File:** `tests/guest-checkout/clear-cart.spec.ts`

**Steps:**

1. Starting from a fresh session, add two or more products to the cart and open the cart page.


    - expect: Cart page shows multiple line items

2. Click the 'Vider le panier' button at the top of the cart page.


    - expect: All line items are removed
    - expect: The empty-cart state is displayed ('Votre panier est vide')
    - expect: Header cart badge no longer shows a count

#### 1.7. Out-of-stock product cannot be added to cart

**File:** `tests/guest-checkout/out-of-stock.spec.ts`

**Steps:**

1. Starting from a fresh session, navigate to the catalog (/products) and locate a product marked 'Rupture de stock' (e.g. 'Casque VR Gaming').


    - expect: The product card shows a 'Rupture de stock' label and its add-to-cart control is disabled

2. Open the out-of-stock product's detail page.


    - expect: Stock status text 'Rupture de stock' is shown in place of the in-stock message
    - expect: The 'Ajouter au panier' button is disabled and cannot be clicked

3. Attempt to click the disabled 'Ajouter au panier' button.


    - expect: No item is added to the cart
    - expect: The header cart badge remains unchanged (0 or unaffected)

#### 1.8. Cart contents behavior across a full page reload / direct URL navigation

**File:** `tests/guest-checkout/cart-persistence-reload.spec.ts`

**Steps:**

1. Starting from a fresh session, add a product to the cart via the product detail page and confirm via the header badge that the cart has 1 item.


    - expect: Header cart badge shows 1

2. Perform a full page reload (or navigate directly by entering the /cart URL rather than clicking an in-app link).


    - expect: Document the resulting cart state: verify whether the item persists or the cart resets to empty. If the cart unexpectedly empties after a reload, flag this as a potential usability/data-persistence issue since a guest shopper could lose their cart by refreshing or opening a link in a new tab.

### 2. Guest Checkout Initiation and Login Gate

**Seed:** `spec/guest-checkout.plan.md`

#### 2.1. Attempting checkout as a guest with items in the cart shows a login-required gate, not a guest checkout form

**File:** `tests/guest-checkout/checkout-gate-with-items.spec.ts`

**Steps:**

1. Starting from a fresh session (no login), add at least one product to the cart via the product page.


    - expect: Header cart badge shows the added item count

2. Open the cart page and click the 'Passer au paiement' button.


    - expect: The app navigates to /checkout
    - expect: Instead of a shipping/billing form, the page shows a heading 'Connexion requise' and the message 'Connectez-vous pour finaliser votre commande et suivre son état en temps réel.'
    - expect: Two actions are presented: 'Se connecter' (linking to /auth) and 'Retour au panier' (linking back to /cart)
    - expect: No shipping method selector, payment fields, promo code field, or order summary/review is displayed on this screen
    - expect: The header cart badge still reflects the item(s) added earlier, confirming the cart was not cleared by hitting the gate

#### 2.2. Attempting checkout as a guest with an empty cart still shows the login gate (not an empty-cart-specific message)

**File:** `tests/guest-checkout/checkout-gate-empty-cart.spec.ts`

**Steps:**

1. Starting from a fresh session with an empty cart (do not add any products).


    - expect: Header cart badge shows no count

2. Navigate directly to the /checkout URL.


    - expect: The same 'Connexion requise' login-gate screen is displayed as when the cart has items, with 'Se connecter' and 'Retour au panier' actions
    - expect: No distinct 'your cart is empty, add items before checking out' messaging is shown at this URL — the login requirement takes precedence over cart-empty state

#### 2.3. No 'continue as guest' or guest checkout option exists anywhere in the flow

**File:** `tests/guest-checkout/no-guest-option-exists.spec.ts`

**Steps:**

1. Starting from a fresh session, add a product to the cart and visit the cart page.


    - expect: No 'guest checkout' or 'continuer sans compte' / 'continuer en tant qu'invité' link or button is present on the cart page alongside 'Passer au paiement'

2. Proceed to /checkout via the 'Passer au paiement' button.


    - expect: The resulting 'Connexion requise' screen offers only 'Se connecter' and 'Retour au panier' — no third option to continue without an account

3. From the checkout gate, click 'Se connecter' to go to /auth.


    - expect: The auth page shows only two tabs: 'Connexion' (Login) and 'Inscription' (Sign up)
    - expect: Neither tab, nor any link/button on the page (including near the terms-of-service text at the bottom), offers a way to proceed as a guest or skip authentication

#### 2.4. 'Retour au panier' from the checkout gate returns to the cart with items intact

**File:** `tests/guest-checkout/gate-back-to-cart.spec.ts`

**Steps:**

1. Starting from a fresh session, add two products to the cart and proceed to /checkout via 'Passer au paiement'.


    - expect: The 'Connexion requise' gate is shown

2. On the 'Connexion requise' screen, click 'Retour au panier'.


    - expect: The app navigates back to /cart
    - expect: Both previously added products are still present with correct quantities and prices
    - expect: Cart summary totals are unchanged from before visiting checkout

#### 2.5. Browser back/forward navigation between cart, checkout gate, and auth pages behaves correctly

**File:** `tests/guest-checkout/back-forward-navigation.spec.ts`

**Steps:**

1. Starting from a fresh session, add a product to the cart, open /cart, then click 'Passer au paiement' to reach the 'Connexion requise' gate at /checkout.


    - expect: The checkout gate screen is displayed

2. Click 'Se connecter' to navigate to /auth.


    - expect: The login/sign-up form is displayed

3. Use the browser Back button.


    - expect: The app returns to the /checkout 'Connexion requise' gate screen (not an error page, not a broken state)

4. Use the browser Back button again.


    - expect: The app returns to /cart with the previously added item(s) still shown

5. Use the browser Forward button twice.


    - expect: Navigation moves forward through /checkout gate and then /auth again without errors or console exceptions, and each page renders its expected content

#### 2.6. Direct URL navigation to /checkout without ever visiting the cart still shows the login gate

**File:** `tests/guest-checkout/direct-checkout-url.spec.ts`

**Steps:**

1. In a completely fresh session (no prior interaction with the site), navigate directly to https://shop.missionplaywright.fr/checkout.


    - expect: The 'Connexion requise' gate is shown immediately, identical to the flow reached via the cart, confirming the login requirement is enforced at the route level for guests regardless of entry point

#### 2.7. No shipping method, payment, promo code, or order-review UI is ever exposed to an unauthenticated guest

**File:** `tests/guest-checkout/no-checkout-substeps-exposed.spec.ts`

**Steps:**

1. Starting from a fresh session, add multiple products (including varying quantities) to the cart to maximize the chance of surfacing any hidden checkout UI.


    - expect: Multiple line items with varying quantities are present in the cart

2. Navigate to /checkout via 'Passer au paiement'.


    - expect: Only the 'Connexion requise' gate is rendered — inspect the full page content and confirm there is no shipping method selector, no delivery address form, no payment/card entry fields, no promo/coupon code input, and no order review or 'place order' / 'confirm order' button anywhere on the page or reachable without first authenticating

3. Attempt to access any hypothetical checkout sub-step directly (for example, try appending common step paths/query parameters such as /checkout?step=shipping or /checkout/payment) if such routes are guessed or discovered via the app's source.


    - expect: Any such attempt either 404s, redirects, or still resolves to the same 'Connexion requise' gate — no guest-accessible shipping, payment, or review step exists

#### 2.8. Cart quantity/content changes made before hitting the login gate are still reflected after returning from the gate

**File:** `tests/guest-checkout/cart-state-round-trip.spec.ts`

**Steps:**

1. Starting from a fresh session, add a product and increase its quantity to 3 in the cart.


    - expect: Cart shows quantity 3 for the item

2. Click 'Passer au paiement' to reach the 'Connexion requise' gate.


    - expect: Gate screen is shown

3. Click 'Retour au panier'.


    - expect: The item's quantity is still 3 and the line total/summary totals are correct and unchanged, confirming the login gate does not silently mutate or reset cart contents

#### 2.9. No promo/coupon code entry point is available to guests anywhere in the cart or checkout gate

**File:** `tests/guest-checkout/no-promo-code-field.spec.ts`

**Steps:**

1. Starting from a fresh session, add a product to the cart and inspect the full cart page content, including the 'Récapitulatif' summary panel.


    - expect: No promo code / coupon code input field or 'Apply code' button is present anywhere on the cart page

2. Proceed to the /checkout login gate and inspect its content.


    - expect: No promo/coupon code field is present on the login-gate screen either, confirming this feature (valid/invalid coupon testing) is currently not reachable by a guest user and cannot be exercised until an authenticated checkout form is implemented
