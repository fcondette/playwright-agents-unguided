# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is not an app under test — it's an **experiment repository** for evaluating how much guidance AI agents
need to produce usable Playwright tests. Everything under `tests/` is agent-generated (by the
`playwright-test-planner` / `playwright-test-generator` / `playwright-test-healer` agents), and is compared
against a hand-written suite that lives in a separate, sibling repository. Keep that provenance intact: don't
quietly "fix up" generated tests into a hand-written style, and don't add hand-written tests to `tests/` — the
point of the repo is measuring the agents' unassisted output.

The application under test is **TechHub** (`shop.missionplaywright.fr`), a French-language e-commerce demo shop
(sandbox training credentials, RFC 2606 reserved domain, fake products/payment fields).

## Commands

```bash
npx playwright test                      # run the full suite (headless, chromium only)
npx playwright test tests/seed.spec.ts   # run a single file
npx playwright test -g "test name"       # run by title
npx playwright show-report               # open the last HTML report
npx playwright install                   # install browser binaries (needed if /mcp shows the MCP server as failed)
```

Use `npx`, not an npm script — there are no npm scripts defined, and using `npx` also matches how the
`playwright-test` MCP server itself invokes Playwright (see below), which matters when reproducing agent runs
by hand.

There is no lint/build step; this is a test-only project (`@playwright/test` + `@types/node`, no app source).

## Architecture: the agent pipeline

This project is driven by three project-level subagents defined in `.claude/agents/` (scaffolded by
`npx playwright init-agents --loop=claude`), run in sequence:

1. **`playwright-test-planner`** — explores the live app (via the `playwright-test` MCP server) starting from
   wherever `tests/seed.spec.ts` leaves off, and writes a Markdown test plan into `specs/`.
2. **`playwright-test-generator`** — reads a plan from `specs/` and writes `.spec.ts` files under `tests/`,
   driving the real browser through the MCP server as it writes each test to verify it as it goes.
3. **`playwright-test-healer`** — debugs and fixes failing generated tests (also via the MCP server: it can run
   tests, inspect traces/console/network, and take live snapshots).

Agent definitions in `.claude/agents/` are loaded once at session start — restart the Claude Code session after
editing one. `/agents` does not list them (that wizard was removed); ask "What subagents are available in this
project?" instead, or invoke them directly by name.

The `spec/` directory (singular — distinct from `specs/`) holds two already-written, detailed exploration plans
(`authenticated-checkout.plan.md`, `guest-checkout.plan.md`) documenting the app's UI structure and known quirks
in depth; read these before writing or healing checkout-related tests, since they encode findings that aren't
otherwise discoverable from the generated specs alone.

## The `playwright-test` MCP server and its constraints

`.mcp.json` registers a single MCP server, `playwright-test`, launched as
`npx playwright run-test-mcp-server --headless`. This is deliberately **not** the general-purpose
`@playwright/mcp` browser server — it's purpose-built for the plan/generate/heal loop (it runs tests, reads
results/traces, and drives the browser through the actual test context). Do not add a second MCP server for
browser automation in this project.

Because the server is launched directly from `.mcp.json` (bypassing npm scripts and any `.env` loader), env vars
that scripts elsewhere might expect are `undefined` at agent runtime. Consequently:

- `playwright.config.ts` hardcodes `baseURL` rather than reading it from the environment.
- Credentials fall back to literal defaults in code: `process.env.TEST_USER_EMAIL ?? "john.doe2@example.com"`
  and `process.env.TEST_USER_PASSWORD ?? "Test12345!"`. These are intentionally committed (sandbox-only
  creds) — do not "fix" this by moving them to `.env` alone, since the agents can't read it at runtime anyway.

## Critical app behavior that shapes every test

The TechHub cart is **client-side React state only** — nothing is persisted to localStorage/cookies. A full
navigation (`page.goto()` or a reload) silently resets the cart to empty. This means:

- Only the very first `page.goto("/")` (login) may be a real navigation. Every step after items are added to
  the cart must proceed via in-app UI clicks (`nav-link-products`, `cart-link`, `checkout-button`,
  `shipping-submit-button`, etc.), never `page.goto()`.
- `tests/seed.spec.ts` must remain a **single `test()`** — each `test()` gets a fresh browser context, so
  splitting login/cart-setup across multiple tests loses all prior state. Use `test.step()` for structure
  within that one test, not additional `test()` blocks.
- Every generated spec under `tests/checkout/` re-derives this same setup inline (login via
  `login-button`/`login-email-input`/`login-password-input`/`login-submit-button`, then add-to-cart via
  `nav-link-products` → product link → `product-detail-add-to-cart`) rather than sharing a fixture — that
  duplication is the agents' own output and matches how the planner instructs the generator to structure tests
  (see `spec/*.plan.md`), not an oversight to refactor away.

The app is locale-`fr`: assertion text, toasts, and labels are in French (e.g. "Connexion réussie",
"Rupture de stock", "#TH-XXXXXXXX" order numbers). New assertions should match this locale rather than
introducing English strings. Elements are primarily targeted via `data-testid` (`page.getByTestId(...)`); form
labels also work with `page.getByLabel(...)` but need `{ exact: true }` where one label is a prefix of another
(e.g. `"Nom"` vs `"Prénom"`).

## Config notes

- `playwright.config.ts`: chromium-only project is enabled; firefox/webkit/mobile/branded-browser projects are
  present but commented out. `trace: "retain-on-failure"`. CI (`.github/workflows/playwright.yml`) runs on
  push/PR to `main`/`master` via `npx playwright test` after `npx playwright install --with-deps`, uploading the
  HTML report as an artifact.
- `.playwright-mcp/` (Playwright MCP exploration artifacts/console logs) and `env/.env.local` are gitignored;
  don't rely on either being present in a fresh checkout.
