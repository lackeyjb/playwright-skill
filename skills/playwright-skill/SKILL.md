---
name: playwright-skill
description: Complete browser automation with Playwright. Auto-detects dev servers, writes clean test scripts to /tmp. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
license: MIT
compatibility: Requires Node.js. Works with Claude Code and other Agent Skills compatible platforms.
metadata:
  author: lackeyjb
  version: "4.2.0"
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Playwright Browser Automation

General-purpose browser automation skill. I'll write custom Playwright code for any automation task you request and execute it via the universal executor.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/playwright-test-*.js`

3. **Use visible browser by default** - Always use `headless: false` unless user specifically requests headless mode

4. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## How It Works

1. You describe what you want to test/automate
2. I auto-detect running dev servers (or ask for URL if testing external site)
3. I write custom Playwright code in `/tmp/playwright-test-*.js` (won't clutter your project)
4. I execute it via: `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
5. Results displayed in real-time, browser window visible for debugging
6. Test files auto-cleaned from /tmp by your OS

## Browser Configuration

Users can configure their preferred browser by creating `.claude/playwright.local.json` in their project:

```json
{
  "browser": "chromium",
  "headless": false,
  "executablePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "slowMo": 50
}
```

Or use a standard Playwright channel like Chrome or Edge:

```json
{
  "browser": "chromium",
  "channel": "chrome",
  "headless": false
}
```

**Configuration options:**

| Option | Values | Description |
|--------|--------|-------------|
| `browser` | `chromium`, `firefox`, `webkit` | Browser engine (default: chromium) |
| `channel` | `chrome`, `msedge`, etc. | Use installed Chrome/Edge instead of Playwright's bundled browser |
| `headless` | `true`, `false` | Run without visible window (default: false) |
| `executablePath` | Path string | Custom browser executable path |
| `slowMo` | Number (ms) | Slow down operations for debugging |

**Common channel values for Chromium:**
- `chrome` - Google Chrome
- `msedge` - Microsoft Edge
- `chrome-beta`, `chrome-dev`, `chrome-canary` - Chrome pre-release
- `msedge-beta`, `msedge-dev` - Edge pre-release

**For Brave Browser:** Use `executablePath` since Brave isn't a standard Playwright channel:
```json
{ "executablePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" }
```

**IMPORTANT:** When a config file exists, scripts should use `launchConfiguredBrowser()` instead of `chromium.launch()` to respect user preferences from `.claude/playwright.local.json`.

## Setup (First Time)

```bash
cd $SKILL_DIR
npm run setup
```

This installs Playwright and the configured browser. If `executablePath` is set in config, browser download is skipped.

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Step 2: Write test script to /tmp with URL parameter**

```javascript
// /tmp/playwright-test-page.js
// Parameterized URL (detected or user-provided)
const TARGET_URL = 'http://localhost:3001'; // <-- Auto-detected or from user

// launchConfiguredBrowser() reads from .claude/playwright.local.json
const browser = await launchConfiguredBrowser();
const page = await browser.newPage();

await page.goto(TARGET_URL);
console.log('Page loaded:', await page.title());

await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
console.log('📸 Screenshot saved to /tmp/screenshot.png');

await browser.close();
```

**Note:** Scripts without `require()` are auto-wrapped with helpers. Use `launchConfiguredBrowser()` to respect user's browser preferences from `.claude/playwright.local.json`.

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && node run.js /tmp/playwright-test-page.js
```

## Common Patterns

### Test a Page (Multiple Viewports)

```javascript
// /tmp/playwright-test-responsive.js
const TARGET_URL = 'http://localhost:3001'; // Auto-detected

const browser = await launchConfiguredBrowser({ slowMo: 100 });
const page = await browser.newPage();

// Desktop test
await page.setViewportSize({ width: 1920, height: 1080 });
await page.goto(TARGET_URL);
console.log('Desktop - Title:', await page.title());
await page.screenshot({ path: '/tmp/desktop.png', fullPage: true });

// Mobile test
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ path: '/tmp/mobile.png', fullPage: true });

await browser.close();
```

### Test Login Flow

```javascript
// /tmp/playwright-test-login.js
const TARGET_URL = 'http://localhost:3001'; // Auto-detected

const browser = await launchConfiguredBrowser();
const page = await browser.newPage();

await page.goto(`${TARGET_URL}/login`);

await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');

// Wait for redirect
await page.waitForURL('**/dashboard');
console.log('✅ Login successful, redirected to dashboard');

await browser.close();
```

### Fill and Submit Form

```javascript
// /tmp/playwright-test-form.js
const TARGET_URL = 'http://localhost:3001'; // Auto-detected

const browser = await launchConfiguredBrowser({ slowMo: 50 });
const page = await browser.newPage();

await page.goto(`${TARGET_URL}/contact`);

await page.fill('input[name="name"]', 'John Doe');
await page.fill('input[name="email"]', 'john@example.com');
await page.fill('textarea[name="message"]', 'Test message');
await page.click('button[type="submit"]');

// Verify submission
await page.waitForSelector('.success-message');
console.log('✅ Form submitted successfully');

await browser.close();
```

### Check for Broken Links

```javascript
const TARGET_URL = 'http://localhost:3000'; // Auto-detected

const browser = await launchConfiguredBrowser();
const page = await browser.newPage();

await page.goto(TARGET_URL);

const links = await page.locator('a[href^="http"]').all();
const results = { working: 0, broken: [] };

for (const link of links) {
  const href = await link.getAttribute('href');
  try {
    const response = await page.request.head(href);
    if (response.ok()) {
      results.working++;
    } else {
      results.broken.push({ url: href, status: response.status() });
    }
  } catch (e) {
    results.broken.push({ url: href, error: e.message });
  }
}

console.log(`✅ Working links: ${results.working}`);
console.log(`❌ Broken links:`, results.broken);

await browser.close();
```

### Take Screenshot with Error Handling

```javascript
const TARGET_URL = 'http://localhost:3000'; // Auto-detected

const browser = await launchConfiguredBrowser();
const page = await browser.newPage();

try {
  await page.goto(TARGET_URL, {
    waitUntil: 'networkidle',
    timeout: 10000,
  });

  await page.screenshot({
    path: '/tmp/screenshot.png',
    fullPage: true,
  });

  console.log('📸 Screenshot saved to /tmp/screenshot.png');
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await browser.close();
}
```

### Test Responsive Design

```javascript
// /tmp/playwright-test-responsive-full.js
const TARGET_URL = 'http://localhost:3001'; // Auto-detected

const browser = await launchConfiguredBrowser();
const page = await browser.newPage();

const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

for (const viewport of viewports) {
  console.log(
    `Testing ${viewport.name} (${viewport.width}x${viewport.height})`,
  );

  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });

  await page.goto(TARGET_URL);
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: `/tmp/${viewport.name.toLowerCase()}.png`,
    fullPage: true,
  });
}

console.log('✅ All viewports tested');
await browser.close();
```

## Inline Execution (Simple Tasks)

For quick one-off tasks, you can execute code inline without creating files:

```bash
# Take a quick screenshot (uses browser from .claude/playwright.local.json)
cd $SKILL_DIR && node run.js "
const browser = await launchConfiguredBrowser();
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await page.screenshot({ path: '/tmp/quick-screenshot.png', fullPage: true });
console.log('Screenshot saved');
await browser.close();
"
```

**When to use inline vs files:**

- **Inline**: Quick one-off tasks (screenshot, check if element exists, get page title)
- **Files**: Complex tests, responsive design checks, anything user might want to re-run

## Available Helpers

Optional utility functions in `lib/helpers.js`:

```javascript
const helpers = require('./lib/helpers');

// Read browser config from .claude/playwright.local.json
const config = helpers.readBrowserConfig();
console.log('Browser config:', config);

// Launch browser with config (auto-reads .claude/playwright.local.json)
const browser = await helpers.launchBrowser();
// Or specify options: helpers.launchBrowser('chromium', { channel: 'brave' })

// Detect running dev servers (CRITICAL - use this first!)
const servers = await helpers.detectDevServers();
console.log('Found servers:', servers);

// Safe click with retry
await helpers.safeClick(page, 'button.submit', { retries: 3 });

// Safe type with clear
await helpers.safeType(page, '#username', 'testuser');

// Take timestamped screenshot
await helpers.takeScreenshot(page, 'test-result');

// Handle cookie banners
await helpers.handleCookieBanner(page);

// Extract table data
const data = await helpers.extractTableData(page, 'table.results');
```

**Auto-injected functions** (available in scripts without `require()`):
- `launchConfiguredBrowser(options)` - Launch browser using config file settings
- `getBrowserConfig()` - Get current browser configuration
- `getContextOptionsWithHeaders(options)` - Merge custom HTTP headers

See `lib/helpers.js` for full list.

## Custom HTTP Headers

Configure custom headers for all HTTP requests via environment variables. Useful for:

- Identifying automated traffic to your backend
- Getting LLM-optimized responses (e.g., plain text errors instead of styled HTML)
- Adding authentication tokens globally

### Configuration

**Single header (common case):**

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

**Multiple headers (JSON format):**

```bash
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

### How It Works

Headers are automatically applied when using `helpers.createContext()`:

```javascript
const context = await helpers.createContext(browser);
const page = await context.newPage();
// All requests from this page include your custom headers
```

For scripts using raw Playwright API, use the injected `getContextOptionsWithHeaders()`:

```javascript
const context = await browser.newContext(
  getContextOptionsWithHeaders({ viewport: { width: 1920, height: 1080 } }),
);
```

## Advanced Usage

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Tips

- **CRITICAL: Detect servers FIRST** - Always run `detectDevServers()` before writing test code for localhost testing
- **Respect user's browser config** - Always use `launchConfiguredBrowser()` to honor `.claude/playwright.local.json` settings
- **Custom headers** - Use `PW_HEADER_NAME`/`PW_HEADER_VALUE` env vars to identify automated traffic to your backend
- **Use /tmp for test files** - Write to `/tmp/playwright-test-*.js`, never to skill directory or user's project
- **Parameterize URLs** - Put detected/provided URL in a `TARGET_URL` constant at the top of every script
- **DEFAULT: Visible browser** - Config defaults to `headless: false` unless user overrides in config or explicitly requests headless
- **Slow down:** Use `slowMo` option (in config or code) to make actions visible and easier to follow
- **Wait strategies:** Use `waitForURL`, `waitForSelector`, `waitForLoadState` instead of fixed timeouts
- **Error handling:** Always use try-catch for robust automation
- **Console output:** Use `console.log()` to track progress and show what's happening

## Troubleshooting

**Playwright not installed:**

```bash
cd $SKILL_DIR && npm run setup
```

**Module not found:**
Ensure running from skill directory via `run.js` wrapper

**Browser doesn't open:**
Check `"headless": false` in `.claude/playwright.local.json` and ensure display available

**Browser executable not found:**
Verify the `executablePath` in `.claude/playwright.local.json` points to a valid browser:
- macOS Brave: `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`
- Linux Brave: `/usr/bin/brave-browser`
- Windows Brave: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`

**Config not being read:**
Config file must be at `.claude/playwright.local.json` in your project (searches upward from cwd)

**Element not found:**
Add wait: `await page.waitForSelector('.element', { timeout: 10000 })`

## Example Usage

```
User: "Test if the marketing page looks good"

Claude: I'll test the marketing page across multiple viewports. Let me first detect running servers...
[Runs: detectDevServers()]
[Output: Found server on port 3001]
I found your dev server running on http://localhost:3001

[Writes custom automation script to /tmp/playwright-test-marketing.js with URL parameterized]
[Runs: cd $SKILL_DIR && node run.js /tmp/playwright-test-marketing.js]
[Shows results with screenshots from /tmp/]
```

```
User: "Check if login redirects correctly"

Claude: I'll test the login flow. First, let me check for running servers...
[Runs: detectDevServers()]
[Output: Found servers on ports 3000 and 3001]
I found 2 dev servers. Which one should I test?
- http://localhost:3000
- http://localhost:3001

User: "Use 3001"

[Writes login automation to /tmp/playwright-test-login.js]
[Runs: cd $SKILL_DIR && node run.js /tmp/playwright-test-login.js]
[Reports: ✅ Login successful, redirected to /dashboard]
```

## Notes

- Each automation is custom-written for your specific request
- Not limited to pre-built scripts - any browser task possible
- Auto-detects running dev servers to eliminate hardcoded URLs
- Test scripts written to `/tmp` for automatic cleanup (no clutter)
- Code executes reliably with proper module resolution via `run.js`
- Progressive disclosure - API_REFERENCE.md loaded only when advanced features needed
