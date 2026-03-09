# Playwright Skill - Complete API Reference

This document contains the comprehensive Playwright API reference and advanced patterns. For quick-start execution patterns, see [SKILL.md](SKILL.md).

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Patterns](#core-patterns)
- [Selectors & Locators](#selectors--locators)
- [Common Actions](#common-actions)
- [Waiting Strategies](#waiting-strategies)
- [Assertions](#assertions)
- [Page Object Model](#page-object-model-pom)
- [Network & API Testing](#network--api-testing)
- [Authentication & Session Management](#authentication--session-management)
- [Visual Testing](#visual-testing)
- [Mobile Testing](#mobile-testing)
- [Debugging](#debugging)
- [Performance Testing](#performance-testing)
- [Parallel Execution](#parallel-execution)
- [Data-Driven Testing](#data-driven-testing)
- [Accessibility Testing](#accessibility-testing)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Common Patterns & Solutions](#common-patterns--solutions)
- [Troubleshooting](#troubleshooting)

## Installation & Setup

### Prerequisites

Before using this skill, ensure Playwright is available:

```bash
# Check if @playwright/test is installed in the project
npm list @playwright/test 2>/dev/null || echo "@playwright/test not installed"

# Install (if needed) — run from the project, not the skill directory
npm install --save-dev @playwright/test@^1.58.2
npx playwright install chromium
```

### Basic Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // In CI: serve the production build (build is a separate CI step before `npx playwright test`)
    // Locally: use dev server for fast iteration
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Core Patterns

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // page, context, and browser are provided by the test runner —
    // always headless in CI, configured via playwright.config.ts
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/My App/);
  });
});
```

### Arrange / Act / Assert

```typescript
import { test, expect } from '@playwright/test';

test('should submit form and redirect', async ({ page }) => {
  // Arrange
  await page.goto('/contact');

  // Act
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByRole('button', { name: /submit/i }).click();

  // Assert
  await expect(page).toHaveURL('/success');
  await expect(page.getByRole('heading')).toHaveText('Thank you!');
});
```

## Selectors & Locators

### Best Practices for Selectors

Prefer in this order (most to least resilient):

```javascript
// 1. BEST: Role + name (semantic, accessible, mirrors how users perceive the UI)
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
await page.getByRole('heading', { level: 1 }).click();

// 2. GOOD: Label (form inputs)
await page.getByLabel('Email address').fill('user@example.com');

// 3. GOOD: Test ID (explicit, stable — add data-testid to components you own)
await page.getByTestId('submit-button').click();
await page.getByTestId('user-input').fill('text');

// 4. OK: Text content (unique text only)
await page.getByText('Sign in').click();
await page.getByText(/welcome back/i).click();

// 5. OK: Placeholder
await page.getByPlaceholder('Search...').fill('query');

// AVOID: CSS classes/IDs/complex selectors (implementation details that change)
await page.locator('.btn-primary').click();              // Avoid
await page.locator('#submit').click();                   // Avoid
await page.locator('div.container > form > button').click(); // Fragile
```

### Advanced Locator Patterns

```javascript
// Filter and chain locators
const row = page.locator('tr').filter({ hasText: 'John Doe' });
await row.locator('button').click();

// Nth element
await page.locator('button').nth(2).click();

// Combining conditions
await page.locator('button').and(page.locator('[disabled]')).count();

// Parent/child navigation
const cell = page.locator('td').filter({ hasText: 'Active' });
const row = cell.locator('..');
await row.locator('button.edit').click();
```

## Common Actions

### Form Interactions

```javascript
// Text input
await page.getByLabel('Email').fill('user@example.com');
await page.getByPlaceholder('Enter your name').fill('John Doe');

// Clear and type character by character (simulates real typing)
await page.locator('#username').clear();
await page.locator('#username').pressSequentially('newuser', { delay: 100 });

// Checkbox
await page.getByLabel('I agree').check();
await page.getByLabel('Subscribe').uncheck();

// Radio button
await page.getByLabel('Option 2').check();

// Select dropdown
await page.selectOption('select#country', 'usa');
await page.selectOption('select#country', { label: 'United States' });
await page.selectOption('select#country', { index: 2 });

// Multi-select
await page.selectOption('select#colors', ['red', 'blue', 'green']);

// File upload
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');
await page.setInputFiles('input[type="file"]', [
  'file1.pdf',
  'file2.pdf'
]);
```

### Mouse Actions

```javascript
// Click variations
await page.click('button');                          // Left click
await page.click('button', { button: 'right' });    // Right click
await page.dblclick('button');                       // Double click
await page.click('button', { position: { x: 10, y: 10 } });  // Click at position

// Hover
await page.hover('.menu-item');

// Drag and drop
await page.dragAndDrop('#source', '#target');

// Manual drag
await page.locator('#source').hover();
await page.mouse.down();
await page.locator('#target').hover();
await page.mouse.up();
```

### Keyboard Actions

```javascript
// Type with delay
await page.keyboard.type('Hello World', { delay: 100 });

// Key combinations
await page.keyboard.press('Control+A');
await page.keyboard.press('Control+C');
await page.keyboard.press('Control+V');

// Special keys
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
await page.keyboard.press('Escape');
await page.keyboard.press('ArrowDown');
```

## Waiting Strategies

### Smart Waiting

```javascript
// Wait for element states
await page.locator('button').waitFor({ state: 'visible' });
await page.locator('.spinner').waitFor({ state: 'hidden' });
await page.locator('button').waitFor({ state: 'attached' });
await page.locator('button').waitFor({ state: 'detached' });

// Wait for specific conditions
await page.waitForURL('**/success');
await page.waitForURL(url => url.pathname === '/dashboard');

// Wait for network
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Wait for function
await page.waitForFunction(() => document.querySelector('.loaded'));
await page.waitForFunction(
  text => document.body.innerText.includes(text),
  'Content loaded'
);

// Wait for response
const responsePromise = page.waitForResponse('**/api/users');
await page.click('button#load-users');
const response = await responsePromise;

// Wait for request
await page.waitForRequest(request =>
  request.url().includes('/api/') && request.method() === 'POST'
);

// Custom timeout
await page.locator('.slow-element').waitFor({
  state: 'visible',
  timeout: 10000  // 10 seconds
});
```

## Assertions

### Common Assertions

```javascript
import { expect } from '@playwright/test';

// Page assertions
await expect(page).toHaveTitle('My App');
await expect(page).toHaveURL('https://example.com/dashboard');
await expect(page).toHaveURL(/.*dashboard/);

// Element visibility
await expect(page.locator('.message')).toBeVisible();
await expect(page.locator('.spinner')).toBeHidden();
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('input')).toBeDisabled();

// Text content
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page.locator('.message')).toContainText('success');
await expect(page.locator('.items')).toHaveText(['Item 1', 'Item 2']);

// Input values
await expect(page.locator('input')).toHaveValue('test@example.com');
await expect(page.locator('input')).toBeEmpty();

// Attributes
await expect(page.locator('button')).toHaveAttribute('type', 'submit');
await expect(page.locator('img')).toHaveAttribute('src', /.*\.png/);

// CSS properties
await expect(page.locator('.error')).toHaveCSS('color', 'rgb(255, 0, 0)');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// Checkbox/Radio state
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
```

## Page Object Model (POM)

### Basic Page Object

```typescript
// pages/LoginPage.ts
import { type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async getErrorMessage() {
    return this.page.getByRole('alert').textContent();
  }
}

// Usage in test
test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

## Network & API Testing

### Intercepting Requests

```javascript
// Mock API responses
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ])
  });
});

// Modify requests
await page.route('**/api/**', route => {
  const headers = {
    ...route.request().headers(),
    'X-Custom-Header': 'value'
  };
  route.continue({ headers });
});

// Block resources
await page.route('**/*.{png,jpg,jpeg,gif}', route => route.abort());
```

### Custom Headers

Use `extraHTTPHeaders` in `playwright.config.ts` or per-test via `page.setExtraHTTPHeaders`:

```typescript
// playwright.config.ts — apply to all requests globally
use: {
  extraHTTPHeaders: {
    'X-Automated-By': 'playwright',
  },
},

// Or per-test
test('with custom header', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Request-ID': 'test-123' });
  await page.goto('/');
});
```

## Visual Testing

### Screenshots

```javascript
// Full page screenshot
await page.screenshot({
  path: 'screenshot.png',
  fullPage: true
});

// Element screenshot
await page.locator('.chart').screenshot({
  path: 'chart.png'
});

// Visual comparison
await expect(page).toHaveScreenshot('homepage.png');
```

## Mobile Testing

Configure device emulation in `playwright.config.ts` — use `@playwright/test` fixtures, not the raw `playwright` package:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

For geolocation/permissions, set them in `use` per project or per test:

```typescript
test('uses geolocation', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  await page.goto('/map');
});
```

## Debugging

### Debug Mode

```bash
# Run with inspector
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Slow motion
npx playwright test --headed --slowmo=1000
```

### In-Code Debugging

```javascript
// Pause execution
await page.pause();

// Console logs
page.on('console', msg => console.log('Browser log:', msg.text()));
page.on('pageerror', error => console.log('Page error:', error));
```

## Performance Testing

```typescript
test('page loads within budget', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // fail the test if too slow
});
```

## Parallel Execution

Enable parallelism in `playwright.config.ts` — `test.describe.parallel` was removed in v1.32:

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,   // All tests run in parallel across workers
  workers: process.env.CI ? 1 : undefined,  // Limit workers in CI
});
```

To run a specific describe block serially within a parallel suite:

```typescript
test.describe.serial('Sequential setup flow', () => {
  test('step 1 - create account', async ({ page }) => { /* ... */ });
  test('step 2 - verify email', async ({ page }) => { /* ... */ });
});
```

## Data-Driven Testing

```javascript
// Parameterized tests
const testData = [
  { username: 'user1', password: 'pass1', expected: 'Welcome user1' },
  { username: 'user2', password: 'pass2', expected: 'Welcome user2' },
];

testData.forEach(({ username, password, expected }) => {
  test(`login with ${username}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('status')).toHaveText(expected);
  });
});
```

## Accessibility Testing

Install `@axe-core/playwright` (maintained by Deque, works with `@playwright/test`):

```bash
npm install --save-dev @axe-core/playwright@^4.11.1
```

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Build app
        run: npm run build
      - name: Run tests
        run: npx playwright test
        env:
          CI: true
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()  # upload even on pass — catches flaky tests that eventually pass
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Best Practices

1. **Test Organization** - Use descriptive test names, group related tests
2. **Selector Strategy** - Prefer data-testid attributes, use role-based selectors
3. **Waiting** - Use Playwright's auto-waiting, avoid hard-coded delays
4. **Error Handling** - Add proper error messages, take screenshots on failure
5. **Performance** - Run tests in parallel, reuse authentication state

## Common Patterns & Solutions

### Handling Popups

```javascript
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.click('button.open-popup')
]);
await popup.waitForLoadState();
```

### File Downloads

```javascript
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button.download')
]);
await download.saveAs(`./downloads/${download.suggestedFilename()}`);
```

### iFrames

```javascript
const frame = page.frameLocator('#my-iframe');
await frame.locator('button').click();
```

### Infinite Scroll

```javascript
async function scrollToBottom(page) {
  const previousHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // Wait for content to load — never use waitForTimeout
  await page.waitForFunction(
    prev => document.body.scrollHeight > prev,
    previousHeight,
    { timeout: 5000 }
  ).catch(() => { /* already at bottom */ });
}
```

## Troubleshooting

### Common Issues

1. **Element not found** - Check if element is in iframe, verify visibility
2. **Timeout errors** - Increase timeout, check network conditions
3. **Flaky tests** - Use proper waiting strategies, mock external dependencies
4. **Authentication issues** - Verify auth state is properly saved

## Quick Reference Commands

```bash
# Run tests
npx playwright test

# Run in headed mode
npx playwright test --headed

# Debug tests
npx playwright test --debug

# Generate code
npx playwright codegen https://example.com

# Show report
npx playwright show-report
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
