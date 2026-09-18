---
name: playwright-skill
description: Complete browser automation with Playwright. Auto-detects dev servers, writes reusable test scripts, and supports screenshots, responsive checks, UX validation, login flows, link checks, and arbitrary browser automation. Use when the user wants to test a website, automate browser interactions, validate web functionality, or perform browser-based testing.
license: MIT
compatibility: Requires Node.js 20+, npm, and network access on first setup to install Playwright and Chromium.
metadata:
  author: lackeyjb
  version: "5.0.0"
allowed-tools: Bash(node:*) Bash(npm:*) Read Write
---

# Playwright Browser Automation

Write and execute focused Playwright scripts for the user's request. Prefer the
skill's executor and helpers, but use the full Playwright API when needed.

## Path resolution

This skill can be installed in several locations, so resolve its directory
first. Set `SKILL_DIR` to the directory containing this SKILL.md file, then run
the commands below as written:

```bash
export SKILL_DIR=<absolute path of the directory containing this SKILL.md>
export TMP_DIR="$(node -p 'require("node:os").tmpdir()')"
```

If shell state does not persist between commands, substitute the literal paths
for `$SKILL_DIR` and `$TMP_DIR` in each command instead.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

## Workflow

1. For localhost work, detect running servers before writing a URL:

   ```bash
   node "$SKILL_DIR/run.js" --detect-servers
   ```

   Extra arguments add custom ports to the default scan. Use the only result
   automatically. Ask which URL to use when there are multiple results. Ask
   for a URL or offer to start a server when none exist.
2. Write reusable scripts to `$TMP_DIR/playwright-test-*.js` unless the user
   asks to save them in the project. Use `PW_SCRIPT_DIR` to preserve scripts.
   Write CommonJS (`require`), not ES modules; the executor resolves
   `playwright` through NODE_PATH, which `import` ignores.
3. Use a visible browser by default. Use `headless: true` only when requested
   or when the environment has no display.
4. Put the target URL in a constant or environment variable.
5. Run scripts with `node "$SKILL_DIR/run.js" <script.js>`. Long flows — a
   visible browser, `SLOW_MO`, multi-viewport screenshots — can exceed the
   shell tool's default timeout (120 s in Claude Code); request a larger
   timeout on the call, up to 600000 ms, so the run is not killed with an
   orphaned browser.
6. Verify visually: open screenshot artifacts with the Read tool (it renders
   PNGs) and check the page before reporting success — console output alone
   misses rendering problems. Report actions, failures, and artifact paths.

## Setup

Run once:

```bash
npm --prefix "$SKILL_DIR" run setup
```

This installs Playwright and Chromium. Use `npm --prefix "$SKILL_DIR" run
install-all-browsers` when Firefox or WebKit is required. Prefer `npm
--prefix` over `cd ... && npm ...` so the command still starts with `npm`
and matches the `Bash(npm:*)` entry in allowed-tools.

## Minimal example

```javascript
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
const artifactDir = process.env.PW_ARTIFACT_DIR || os.tmpdir();

(async () => {
  const browser = await chromium.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(targetUrl);
    console.log('Page loaded:', await page.title());
    await page.screenshot({ path: path.join(artifactDir, 'page.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
```

Run it:

```bash
node "$SKILL_DIR/run.js" "$TMP_DIR/playwright-test-page.js"
```

For short one-off tasks, use inline execution:

```bash
node "$SKILL_DIR/run.js" -e "const browser = await chromium.launch({headless: false}); try { const page = await browser.newPage(); await page.goto('https://example.com'); console.log(await page.title()); } finally { await browser.close(); }"
```

Inline snippets run with `chromium`, `firefox`, `webkit`, `devices`,
`expect`, and `helpers` already in scope. The `-e` process exits as soon as
the snippet settles, so close the browser inside the snippet.

## Current Playwright patterns

Prefer locators that describe what a user sees, in this order:

1. `page.getByRole()` with an accessible name
2. `page.getByLabel()` for form controls
3. `page.getByText()` for visible content
4. `page.getByTestId()` when the application provides a test contract

Actions auto-wait for actionability. Use web-first assertions from
`@playwright/test` (`const { expect } = require('@playwright/test')`) or a
locator's `waitFor()` instead of `waitForSelector()`, fixed sleeps, or
`networkidle`.

```javascript
await page.getByLabel('Email').fill('test@example.com');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/dashboard');
await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
```

## Common tasks

### Responsive checks

```javascript
{
  const os = require('node:os');
  const path = require('node:path');

  const artifactDir = process.env.PW_ARTIFACT_DIR || os.tmpdir();
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(targetUrl);
    await page.screenshot({ path: path.join(artifactDir, `${viewport.name}.png`), fullPage: true });
  }
}
```

### Login flow

Use test credentials supplied by the user. Never invent or expose real
credentials. Verify both the navigation and a post-login element.

```javascript
await page.goto(`${targetUrl}/login`);
await page.getByLabel('Email').fill(process.env.TEST_EMAIL);
await page.getByLabel('Password').fill(process.env.TEST_PASSWORD);
await page.getByRole('button', { name: /sign in|log in/i }).click();
await page.waitForURL('**/dashboard');
await page.getByRole('heading', { name: /dashboard/i }).waitFor();
```

### Save scripts and artifacts

```bash
PW_SCRIPT_DIR=./playwright-tests node "$SKILL_DIR/run.js" "$TMP_DIR/playwright-test-login.js"
PW_ARTIFACT_DIR=./playwright-artifacts node "$SKILL_DIR/run.js" "$TMP_DIR/playwright-test-page.js"
```

`PW_SCRIPT_DIR` copies file-based scripts before execution and adds a timestamp
when a filename already exists. `PW_ARTIFACT_DIR` controls helper screenshot
output; the default is the operating system temporary directory.

### Connect to an existing Chrome session

Start Chrome with remote debugging enabled, then connect with Playwright:

```javascript
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = browser.contexts()[0].pages()[0];
```

This reuses cookies and extensions in that session. Do not use it for secrets
unless the user explicitly asks; a connected browser has the user's access.

## Helpers

```javascript
const helpers = require(`${process.env.PW_SKILL_DIR}/lib/helpers`);

const servers = await helpers.detectDevServers();
const browser = await helpers.launchBrowser('chromium');
const context = await helpers.createContext(browser);
const page = await context.newPage();
await helpers.handleCookieBanner(page);
await helpers.fillLabeledField(page, 'Email', 'user@example.com');
await helpers.takeScreenshot(page, 'result');
```

Available helpers are `allScopes`, `clickTextAnywhere`, `createContext`,
`detectDevServers`, `fillLabeledField`, `getExtraHeadersFromEnv`,
`handleCookieBanner`, `launchBrowser`, `sleep`, `takeScreenshot`, and
`waitTextAnywhere`.

- `allScopes(pageOrContext)`: every page and iframe as `{ page, frame, label }`.
- `clickTextAnywhere(pageOrContext, text, { exact, timeout, attempts, gapMs })`:
  clicks the first visible text match across every page and iframe and
  returns `false` when nothing matched. Pass `attempts` to keep retrying
  while a slow page renders. Use it when the frame is unknown; prefer a
  direct locator when the frame is known.
- `fillLabeledField(pageOrContext, labelText, value, { exact })`: fills the
  text control associated with a visible label — native label association
  first, then same-cell or next-in-document-order heuristics for
  unassociated markup. Returns `false` when nothing was filled.
- `sleep(ms)`: promise delay for pacing and backoff. Prefer locator waits
  over sleeps for readiness.
- `waitTextAnywhere(pageOrContext, text, { timeout, pollMs, exact })`: waits
  until the text is visible in any page or iframe and returns `false` on
  timeout. Use it to verify outcomes after actions.

Use Playwright locators and assertions directly for actions, waits, extraction,
authentication, tables, and retries.

## Configuration

- `PW_BROWSER`: `chromium`, `firefox`, or `webkit` for `launchBrowser()`.
- `PW_CHANNEL`: installed browser channel such as `chrome` or `msedge`.
- `PW_EXECUTABLE_PATH`: explicit browser executable path.
- `PW_HEADLESS`: `true` or `false`; visible mode is the default.
- `SLOW_MO`: action delay in milliseconds.
- `PW_LOCALE`: context locale such as `en-US` or `zh-CN`; defaults to the
  system locale.
- `PW_TIMEZONE`: context timezone such as `Asia/Shanghai`; defaults to the
  system timezone.
- `PW_HEADER_NAME` and `PW_HEADER_VALUE`: one extra HTTP header.
- `PW_EXTRA_HEADERS`: JSON object of extra HTTP headers.
- `PW_SCRIPT_DIR`: directory for preserving file-based scripts.
- `PW_ARTIFACT_DIR`: directory for helper-generated screenshots.

See [API_REFERENCE.md](API_REFERENCE.md) for network interception, API mocking,
authentication state, video, visual checks, device emulation, and CI patterns.
