---
name: playwright-test
description: Write CI-ready E2E test suites with Playwright Test. Explores the project to understand the app's structure and framework, then writes persistent *.spec.ts test files to the project's test directory and generates playwright.config.ts. Use when you need to write browser-based end-to-end tests that run in automated CI pipelines (GitHub Actions, GitLab CI, etc.).
argument-hint: [project-path or spec-file] [--headed] [--grep <pattern>]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm install*), Bash(npx playwright*)
---

# Playwright E2E Test Suite Writer

I write complete, CI-ready E2E test suites using `@playwright/test`. Tests are written **to the project's test directory** (not /tmp) so they persist, are committed to source control, and run reliably in CI pipelines.

**CRITICAL WORKFLOW - Follow these steps in order:**

## Step 1: Explore the Project

**Use your Read, Glob, and Grep tools — not shell commands — to explore the codebase.**

Tests are only production-ready if they match the actual app. Generic templates will fail. Read the code first.

### Package & Config

```
Read: <project-root>/package.json          — framework, dev/build/start scripts, port, deps
Glob: <project-root>/playwright.config.*   — existing Playwright setup
Read: <project-root>/.env.example          — what env vars the app requires (or .env.local.example)
Read: <project-root>/.env                  — actual values if present (never commit secrets)
```

Extract:
- **Framework**: Next.js, Vite, CRA, Express, Remix, etc.
- **Dev server command**: exact script name (`dev`, `start`, `serve`)
- **Build command**: exact script name (`build`) — needed for CI
- **Production serve command**: `start`, `preview`, etc. — what runs after `build` in CI
- **Port**: from scripts, `.env`, or framework defaults (Next.js=3000, Vite=5173, CRA=3000)
- **Required env vars**: everything in `.env.example` — the CI workflow must supply all of them
- **`@playwright/test` in devDependencies**: skip install if already present

### Routes & Pages

Read the routing layer to know what URLs exist — don't guess:

```
# Next.js App Router
Glob: <project-root>/app/**/page.tsx

# Next.js Pages Router
Glob: <project-root>/pages/**/*.tsx

# React Router (find the router definition)
Grep: "createBrowserRouter|<Route|<Routes" in src/

# Express / Fastify
Grep: "app\.get|router\.get|fastify\.get" in src/
```

### Auth Flow

Read the actual login UI, not docs — you need the real field labels and post-login URL:

```
Grep: "login|signin|sign-in" in src/ for the login page/component
Read: the login component/page file
```

Look for:
- Actual label text on email/username and password fields
- The submit button's text
- Where the app redirects after successful login (e.g., `/dashboard`, `/home`, `/app`)
- Whether auth uses a form, OAuth redirect, magic link, etc.

### Key User Flows

Read the main components to understand what the app actually does:

```
Glob: <project-root>/src/components/**/*.tsx  (or .jsx, .vue, .svelte)
Read: the nav/layout component — reveals all main sections
Read: key feature components for the flows you'll test
```

### Existing Tests

Avoid duplicating coverage that already exists:

```
Glob: <project-root>/e2e/**/*.spec.ts
Glob: <project-root>/cypress/**/*.cy.ts
Grep: "test\(|it\(|describe\(" in src/ — unit/integration test coverage
```

After this exploration you should know:
- Every URL you'll navigate to
- The actual text of labels, buttons, and headings you'll interact with
- What the app does after login
- What's already tested vs. what's missing

## Step 2: Plan the Test Suite

Based on the project, decide:
- **Where to write tests**: Use existing structure, or create `e2e/` at project root
- **What to test**: Key user flows (auth, navigation, critical features) inferred from the codebase
- **What URL pattern to use**: Always use `process.env.BASE_URL || 'http://localhost:<port>'`

## Step 3: Install @playwright/test (if not present)

```bash
cd <project-root>
npm install --save-dev @playwright/test
npx playwright install chromium
```

## Step 4: Generate playwright.config.ts (if not present)

Write `playwright.config.ts` to the project root:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Single source of truth for the dev server URL.
// Override with BASE_URL env var in CI to point at a deployed environment.
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // <-- adjust port to match your app

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
  },
  projects: [
    // If the app has authentication, add a setup project (see Auth Patterns below).
    // Remove these two lines for apps with no login:
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json', // remove if no auth
      },
      dependencies: ['setup'], // remove if no auth
    },
  ],
  webServer: {
    // In CI: use the production server (app must already be built — see CI workflow)
    // Locally: use the dev server for fast iteration
    // Adjust command for your framework:
    //   Next.js:  CI ? 'npm run start' : 'npm run dev'
    //   Vite:     CI ? 'npm run preview' : 'npm run dev'
    //   CRA:      CI ? 'serve -s build' : 'npm run start'
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
```

**Key CI settings:**
- `forbidOnly`: Fails CI if `.only` is accidentally committed
- `retries: 2`: Handles flakiness in CI
- `workers: 1`: Avoids resource contention on CI runners
- `headless: true`: No display required in CI
- `screenshot/video/trace`: Artifacts on failure for debugging
- `BASE_URL` constant: port defined once — both `use.baseURL` and `webServer.url` reference it
- `webServer.command`: serves the **production build** in CI (see CI workflow for build step)

## Step 5: Write Test Spec Files

Write spec files to `<project-root>/e2e/` using `@playwright/test` syntax:

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/My App/);
  });

  test('renders main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('hero CTA is clickable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /get started/i }).click();
    await expect(page).not.toHaveURL('/');
  });
});
```

## Step 6: Run Tests to Validate

```bash
# Run all tests
cd <project-root> && npx playwright test

# Run a specific spec file
cd <project-root> && npx playwright test e2e/homepage.spec.ts

# Run with headed browser for local debugging
cd <project-root> && npx playwright test --headed
```

**If tests fail:**
- Run with `--headed` to watch the browser and see what's actually on screen
- Read the failure output — Playwright reports the expected vs. actual value and a screenshot path
- The most common causes:
  - **Wrong selector**: re-read the component source to find the actual label/role/text
  - **Wrong URL**: check the actual redirect after login by reading auth code
  - **App not started**: ensure `webServer.command` in config matches the actual dev script
  - **Timing**: if an element isn't found, add `await expect(locator).toBeVisible()` before interacting
- Fix the test to match what the app actually does — never change assertions to make failures pass artificially

---

## Test Patterns

### Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(/invalid/i);
  });
});
```

### Authenticated Tests — Setup Project (Recommended)

The official Playwright auth pattern. Runs login as a real test, so failures show traces and screenshots rather than cryptic startup errors. Supports multiple roles naturally.

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);     // ACTUAL label from component
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard');                             // ACTUAL post-login URL
  await page.context().storageState({ path: authFile });
});
```

The `playwright.config.ts` template above already includes the `setup` project and `dependencies: ['setup']`. Every test starts authenticated via `storageState`.

To opt a test **out** of auth (e.g., testing the login page itself):
```typescript
test.use({ storageState: { cookies: [], origins: [] } });
```

For API mocking, form submission, navigation patterns, Page Object Model, and the full `@playwright/test` API, see [API_REFERENCE.md](API_REFERENCE.md).

---

## CI Configuration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - uses: actions/cache@v4  # cache browsers — avoids re-downloading ~200MB
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium

      - name: Build app  # build first — fails clearly if TypeScript/build errors exist
        run: npm run build
        # env: NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}  # add build-time vars

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}      # see CI Environment Variables section
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          # DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - uses: actions/upload-artifact@v4
        if: always()  # upload even on pass — catches flaky tests that eventually pass
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### GitLab CI

```yaml
# .gitlab-ci.yml (e2e stage)
e2e-tests:
  # Pin to the same Playwright version as in package.json
  image: mcr.microsoft.com/playwright:v1.58.2-jammy
  stage: test
  script:
    - npm ci
    - npm run build        # build first — tests run against production build
    - npx playwright test
  variables:
    CI: "true"
    TEST_EMAIL: $TEST_EMAIL       # set in GitLab CI/CD variables
    TEST_PASSWORD: $TEST_PASSWORD
    # DATABASE_URL: $DATABASE_URL
  artifacts:
    when: always  # upload even on pass — catches flaky tests that eventually pass
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
```

### CI Environment Variables

E2E tests in CI need more than `CI=true`. Read `.env.example` in Step 1 to identify everything required, then ensure all of it is available in CI.

**Always needed:**
| Variable | Source | Notes |
|---|---|---|
| `TEST_EMAIL` | CI secret | Login credentials for test user |
| `TEST_PASSWORD` | CI secret | Login credentials for test user |

**Usually needed (check `.env.example`):**
| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | CI secret | If the app connects to a real DB in tests |
| `NEXTAUTH_SECRET` / `JWT_SECRET` | CI secret | Session signing key — app won't start without it |
| `NEXT_PUBLIC_API_URL` | CI var or secret | If the frontend calls an external API |
| App-specific secrets | CI secret | Anything else in `.env.example` |

**Never hardcode secrets in the workflow file.** Set them in:
- GitHub Actions: Settings → Secrets and variables → Actions → New repository secret
- GitLab: Settings → CI/CD → Variables

**Telling the user what secrets to add:** After reading `.env.example`, tell the user exactly which variables they need to add as secrets before the CI workflow will work. Don't assume they already know.

---

## Selector Best Practices

Prefer in this order (most to least resilient):

```typescript
// 1. Role + name (best: semantic, accessible)
page.getByRole('button', { name: 'Submit' })
page.getByRole('link', { name: 'About' })
page.getByRole('textbox', { name: 'Email' })

// 2. Label (form inputs)
page.getByLabel('Email address')

// 3. Test ID (explicit, stable)
page.getByTestId('submit-btn')

// 4. Text content
page.getByText('Welcome back')

// 5. Placeholder
page.getByPlaceholder('Search...')

// Avoid: CSS selectors, XPath, positional selectors
// Only use as last resort:
page.locator('.specific-class')
page.locator('#specific-id')
```

---

## Adding .gitignore Entries

```
# Playwright test output
/test-results/
/playwright-report/
# Saved auth state — contains session tokens, never commit
/e2e/.auth/
```

The browser cache (`~/.cache/ms-playwright`) lives outside the project — don't gitignore it. In CI, cache it between runs (the CI workflow above already includes `actions/cache@v4` for this) to avoid re-downloading ~200MB on every run.

---

## Tips

- **Always explore first** - read `package.json`, route files, auth components, and `.env.example` before writing anything
- **Build before testing in CI** - `npm run build` as a separate CI step before `npx playwright test`; `webServer.command` in CI should serve the built app (`npm run start`, `npm run preview`), not the dev server
- **Use `baseURL`** - write `page.goto('/')` not `page.goto('http://localhost:3000/')` so tests work in any environment
- **Prefer role selectors** - `getByRole`, `getByLabel`, `getByTestId` over CSS selectors; read the actual component to find real labels, not guesses
- **`forbidOnly`** - catches accidental `.only` in CI before it skips the entire suite
- **Test isolation** - each test should be independent; use `beforeEach` for shared setup, not shared state
- **`storageState` for auth** - use the setup project pattern (`e2e/auth.setup.ts` + `dependencies: ['setup']`) to log in once and reuse auth state across all tests; per-test login multiplies CI time
- **Artifact patterns** - always configure `screenshot: 'only-on-failure'` and upload `playwright-report/` in CI
- **`webServer` config** - use `reuseExistingServer: !process.env.CI` so CI always starts fresh but local dev reuses running servers
- **Environment variables** - read `.env.example` and tell the user which variables must be set as CI secrets
- **No hardcoded waits** - never use `page.waitForTimeout()`; use `waitForURL`, locator assertions, or `expect.poll()` for async conditions (e.g. polling an API status until it returns 200)
- **`eslint-plugin-playwright`** - add to the project to enforce best practices at lint time (catches `waitForTimeout`, focused tests, etc.) before they reach CI
