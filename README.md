# Playwright Test Agents — Setup and Workflow

Notes on setting up Claude Code with the Playwright test agents (planner,
generator, healer) in VS Code on Ubuntu.

This repository exists to evaluate how much guidance AI agents need to produce
usable Playwright tests. Everything under `tests/` is agent-generated. The
hand-written suite it is compared against lives in a separate repository.

---

## 1. Install Claude Code

```bash
npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code
claude --version
```

Use the `--allow-scripts` form from the start. Without it, npm blocks the
package's postinstall script and leaves a wrapper on `PATH` with no binary
behind it, producing:

```
Error: claude native binary not installed.
```

If that happens, run the postinstall manually:

```bash
node $(npm root -g)/@anthropic-ai/claude-code/install.cjs
```

**Under nvm:** global packages install into the active Node version's directory.
Switching versions with `nvm use` makes `claude` disappear; reinstall it for that
version.

This is a one-time, machine-wide install — not per project.

## 2. VS Code extension (optional)

`Ctrl+Shift+X` → search "Claude Code" → install. Requires VS Code 1.94.0 or
later.

The extension provides a panel with side-by-side diffs; the CLI provides slash
commands in a terminal. Both use the same account. The extension bundles its own
private copy of the CLI, so step 1 is still required for the `claude` command to
work in a terminal.

## 3. Scaffold the agents

Per project, from the repository root:

```bash
npx playwright init-agents --loop=claude
```

Requires Playwright 1.56 or later. It creates:

| Path | Purpose |
|---|---|
| `.claude/agents/` | planner, generator and healer definitions |
| `.mcp.json` | registers the `playwright-test` MCP server |
| `specs/` | destination for generated test plans |
| `tests/seed.spec.ts` | empty seed template |

Back up any existing `.mcp.json` first — this replaces it.

**Do not also run `claude mcp add playwright npx @playwright/mcp@latest`.** That
registers a second, overlapping browser server. `init-agents` already wires up
the correct one (`playwright-test`), which is purpose-built for the agent loop:
it runs tests, reads results and traces, and drives the browser through the test
context.

## 4. Configure before the first run

The MCP server launches as `npx playwright run-test-mcp-server`, directly from
`.mcp.json`. This bypasses npm scripts and therefore bypasses `dotenvx`, so any
`process.env` value will be `undefined` when the agents run anything.

**`playwright.config.ts`** — hardcode the base URL rather than reading it from
the environment:

```typescript
use: {
	baseURL: "https://shop.missionplaywright.fr",
}
```

**Credentials in the seed** — same problem, same approach:

```typescript
const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";
```

These are sandbox training credentials on an RFC 2606 reserved domain,
controlling a demo shop with fake products and fake payment fields. They are
committed deliberately, because the agent workflow cannot read them from `.env`.

## 5. Write the seed test

The planner runs `tests/seed.spec.ts` to obtain a live browser, then explores
from wherever that test leaves off. An empty seed gives it nothing to explore.

Two constraints:

- **It must be a single `test()`.** Each `test()` gets a fresh browser context,
  so splitting login and setup across two tests loses everything the first one
  did. Use `test.step()` for structure within the one test.
- **Cart state must be built through in-app clicks.** On this application, cart
  contents are held only in client-side memory: `page.goto()` or a page reload
  clears them. See `FINDINGS.md` in the hand-written repository.

```typescript
import { test, expect } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "john.doe2@example.com";
const password = process.env.TEST_USER_PASSWORD ?? "Test12345!";

test.describe("Seed", () => {
	test("login and add a product to the cart", async ({ page }) => {
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
	});
});
```

Verify it passes before invoking any agent:

```bash
npx playwright test tests/seed.spec.ts
```

`npx` deliberately, rather than an npm script — this reproduces the conditions
the MCP server runs under.

## 6. First session

```bash
cd /home/fred/dev/Playwright/MissionPlaywrightAI
claude
```

The working directory determines which `.claude/`, `.mcp.json` and `CLAUDE.md`
are loaded. The same binary behaves entirely differently depending on where it
is launched from.

First run prompts for:

- **Theme** — cosmetic, shows a sample diff to check colour readability
- **Sign-in** — opens a browser; any paid Claude subscription works, no API key
- **Folder trust** — accept for your own repository
- **MCP server approval** — choose *"Use this MCP server"*, not *"Use this and
  all future MCP servers in this project"*. Re-running `init-agents` can rewrite
  `.mcp.json`, and the prompt is one keystroke.

**Set permission mode to Manual.** Auto is now the default and approves actions
without asking. `Shift+Tab` cycles modes in the terminal; in the extension the
control sits at the bottom of the prompt box.

## 7. Verify

```
/mcp
```

Expect `playwright-test · connected · 87 tools`. If it shows `failed`, the usual
cause is missing browser binaries — run `npx playwright install`.

`/agents` no longer lists the agents; that wizard was removed. Ask instead:

```
What subagents are available in this project?
```

Three project agents should appear (`playwright-test-planner`,
`playwright-test-generator`, `playwright-test-healer`) alongside Claude Code's
own built-ins.

## 8. Run the pipeline

```
Use the playwright-test-planner agent to write a test plan for the
authenticated checkout flow. Use tests/seed.spec.ts as the seed.
```

Naming the seed explicitly is worth doing: left to itself, the planner has
written the plan's own path into the `Seed:` field of every scenario, which the
generator then reads.

The plan lands in `specs/` as Markdown. **Read it before generating anything.**
Claude Code may chain into the generator on its own if prompts are approved
without reading them — worth watching for, since it changes which decisions were
yours.

Agents in `.claude/agents/` are loaded at session start only. Editing a
definition requires restarting the session.

## Useful commands

| Command | Effect |
|---|---|
| `claude` | start a session in the current directory |
| `claude --continue` | resume the most recent session in that directory |
| `/mcp` | list MCP servers and connection status |
| `/usage` | plan consumption for the session and week |
| `/exit` | end the session |

Browser snapshots are context-heavy, so agent runs consume usage noticeably
faster than ordinary chat. `/usage` after a planner run is worth a look.
