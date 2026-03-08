---
name: playwright-skill
description: Write CI-ready E2E test suites with Playwright Test. Explores the project to understand the app's structure and framework, then writes persistent *.spec.ts test files to the project's test directory and generates playwright.config.ts. Use when you need to write browser-based end-to-end tests that run in automated CI pipelines (GitHub Actions, GitLab CI, etc.).
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations. Before executing commands, determine the skill directory based on where you loaded this SKILL.md file and replace `$SKILL_DIR` with the actual path.

Common installation paths:
- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Playwright E2E Test Suite Writer

I write complete, CI-ready E2E test suites using `@playwright/test`. Tests are written **to the project's test directory** (not /tmp) so they persist, are committed to source control, and run reliably in CI pipelines.

**CRITICAL WORKFLOW - Follow these steps in order:**

## Step 1: Explore the Project

Before writing a single line of test code, understand what you're testing:

```bash
# Read the project's package.json
cat <project-root>/package.json

# Check for existing Playwright config
ls <project-root>/playwright.config.* 2>/dev/null || echo "No config found"

# Check for existing test structure
ls -la <project-root>/e2e/ <project-root>/tests/ <project-root>/playwright/ 2>/dev/null || echo "No test dir found"

# Understand the app's dev/start commands
```

Look for:
- **Framework**: Next.js, Vite, CRA, Express, etc.
- **Dev server command**: `npm run dev`, `npm start`, `npm run serve`, etc.
- **Default port**: Often in scripts or `.env` files
- **Existing test setup**: `playwright.config.ts`, existing spec files, `test-results/` in `.gitignore`
- **`@playwright/test` already installed**: Check `devDependencies`

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
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',   // <-- adjust to actual dev command
    url: 'http://localhost:3000',
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
cd $SKILL_DIR && node run.js <project-root>

# Run a specific spec file
cd $SKILL_DIR && node run.js <project-root>/e2e/homepage.spec.ts

# Run with headed browser for local debugging
cd $SKILL_DIR && node run.js <project-root> --headed
```

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

### Authenticated Tests (Shared Login State)

```typescript
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test';

// Use a distinct fixture name — never shadow the built-in `page` fixture.
// This lets the same spec file mix authenticated and unauthenticated tests.
export const test = base.extend<{ authenticatedPage: typeof base['_fixtures']['page'] }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_EMAIL || 'test@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || 'password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect };

// e2e/dashboard.spec.ts
import { test, expect } from './fixtures';

test('dashboard shows user data', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.getByTestId('welcome-message')).toBeVisible();
});
```

### API Mocking

```typescript
// e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test('product list renders from API', async ({ page }) => {
  // Mock the API response
  await page.route('**/api/products', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Widget A', price: 9.99 },
        { id: 2, name: 'Widget B', price: 19.99 },
      ]),
    });
  });

  await page.goto('/products');

  await expect(page.getByText('Widget A')).toBeVisible();
  await expect(page.getByText('Widget B')).toBeVisible();
});
```

### Form Submission

```typescript
// e2e/contact.spec.ts
import { test, expect } from '@playwright/test';

test('contact form submits successfully', async ({ page }) => {
  await page.goto('/contact');

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByLabel('Message').fill('Hello, this is a test message.');
  await page.getByRole('button', { name: /send/i }).click();

  await expect(page.getByRole('alert', { name: /success/i })).toBeVisible();
});
```

### Navigation & Routing

```typescript
// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('nav links route correctly', async ({ page }) => {
    await page.goto('/');

    for (const [linkName, expectedPath] of [
      ['About', '/about'],
      ['Pricing', '/pricing'],
      ['Blog', '/blog'],
    ]) {
      await page.goto('/');
      await page.getByRole('link', { name: linkName }).click();
      await expect(page).toHaveURL(expectedPath);
    }
  });

  test('browser back/forward works', async ({ page }) => {
    await page.goto('/');
    await page.goto('/about');
    await page.goBack();
    await expect(page).toHaveURL('/');
    await page.goForward();
    await expect(page).toHaveURL('/about');
  });
});
```

### Page Object Model (complex apps)

```typescript
// e2e/pages/LoginPage.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

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
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
          BASE_URL: http://localhost:3000

      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### GitLab CI

```yaml
# .gitlab-ci.yml (e2e stage)
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.58.2-jammy
  stage: test
  script:
    - npm ci
    - npx playwright test
  variables:
    CI: "true"
    BASE_URL: "http://localhost:3000"
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
```

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

Always add these to the project's `.gitignore`:

```
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

---

## Tips

- **Always explore first** - read `package.json` and existing test structure before writing anything
- **Use `baseURL`** - write `page.goto('/')` not `page.goto('http://localhost:3000/')` so tests work in any environment
- **Prefer role selectors** - `getByRole`, `getByLabel`, `getByTestId` over CSS selectors
- **`forbidOnly`** - catches accidental `.only` in CI before it skips the entire suite
- **Test isolation** - each test should be independent; use `beforeEach` for shared setup, not shared state
- **Artifact patterns** - always configure `screenshot: 'only-on-failure'` and upload `playwright-report/` in CI
- **`webServer` config** - use `reuseExistingServer: !process.env.CI` so CI always starts fresh but local dev reuses running servers
- **Environment variables** - use `process.env.BASE_URL`, `process.env.TEST_EMAIL`, etc. for CI flexibility
- **No hardcoded waits** - never use `page.waitForTimeout()`; use `waitForURL`, `waitForSelector`, `expect().toBeVisible()`
