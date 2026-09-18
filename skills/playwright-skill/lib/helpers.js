const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');

function getExtraHeadersFromEnv() {
  const name = process.env.PW_HEADER_NAME;
  const value = process.env.PW_HEADER_VALUE;
  if (name && value) return { [name]: value };

  if (!process.env.PW_EXTRA_HEADERS) return null;
  try {
    const headers = JSON.parse(process.env.PW_EXTRA_HEADERS);
    if (headers && typeof headers === 'object' && !Array.isArray(headers)) return headers;
    console.warn('PW_EXTRA_HEADERS must be a JSON object; ignoring it.');
  } catch (error) {
    console.warn(`Failed to parse PW_EXTRA_HEADERS: ${error.message}`);
  }
  return null;
}

async function launchBrowser(browserType = process.env.PW_BROWSER || 'chromium', options = {}) {
  const browser = { chromium, firefox, webkit }[browserType];
  if (!browser) throw new Error(`Invalid browser type: ${browserType}`);

  const headlessValue = process.env.PW_HEADLESS || process.env.HEADLESS || 'false';
  // ponytail: Chromium refuses to start as root without --no-sandbox; only add it there
  const needsNoSandbox = browserType === 'chromium' && process.getuid?.() === 0;
  const launchOptions = {
    headless: headlessValue !== 'false',
    slowMo: Number(process.env.SLOW_MO) || 0,
    ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
    ...(process.env.PW_EXECUTABLE_PATH && { executablePath: process.env.PW_EXECUTABLE_PATH }),
    ...options,
    ...(needsNoSandbox && { args: ['--no-sandbox', ...(options.args ?? [])] }),
  };
  return browser.launch(launchOptions);
}

async function createContext(browser, options = {}) {
  const headers = { ...getExtraHeadersFromEnv(), ...options.extraHTTPHeaders };
  const contextOptions = {
    viewport: { width: 1280, height: 720 },
    // Follow the system locale and timezone unless pinned via environment;
    // hardcoded values skew results on non-en-US systems.
    ...(process.env.PW_LOCALE && { locale: process.env.PW_LOCALE }),
    ...(process.env.PW_TIMEZONE && { timezoneId: process.env.PW_TIMEZONE }),
    ...options,
    ...(Object.keys(headers).length > 0 && { extraHTTPHeaders: headers }),
  };
  delete contextOptions.mobile;
  return browser.newContext(contextOptions);
}

async function takeScreenshot(page, name, options = {}) {
  const { directory, path: customPath, ...screenshotOptions } = options;
  let filename = customPath;
  if (!filename) {
    const outputDirectory = directory || process.env.PW_ARTIFACT_DIR || os.tmpdir();
    fs.mkdirSync(outputDirectory, { recursive: true });
    filename = path.join(outputDirectory, `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
  }
  await page.screenshot({ path: filename, fullPage: screenshotOptions.fullPage !== false, ...screenshotOptions });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

async function handleCookieBanner(page, timeout = 3000) {
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("I agree")',
    '.cookie-accept',
    '#cookie-accept',
    '[data-testid="cookie-accept"]',
  ];
  for (const selector of selectors) {
    try {
      await page.locator(selector).filter({ visible: true }).first().click({ timeout: timeout / selectors.length });
      console.log('Cookie banner dismissed');
      return true;
    } catch {
      // Try the next common selector.
    }
  }
  return false;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Every page and iframe of a BrowserContext (or a single Page) as
// { page, frame, label } targets, main frames before their iframes.
function allScopes(target) {
  const pages = typeof target.pages === 'function' ? target.pages() : [target];
  const scopes = [];
  for (const page of pages) {
    const main = page.mainFrame();
    scopes.push({ page, frame: main, label: `page ${page.url()}` });
    for (const frame of page.frames()) {
      if (frame !== main) scopes.push({ page, frame, label: `iframe ${frame.url()}` });
    }
  }
  return scopes;
}

// Best-effort click on visible text whose page or iframe is unknown: tries
// role links, exact text, then generic containers, across every scope.
// Returns false when nothing matched; prefer a direct locator on a known frame.
// attempts > 1 keeps retrying while a slow page renders, sleeping gapMs between.
async function clickTextAnywhere(target, text, { exact = true, timeout = 5000, attempts = 1, gapMs = 2000 } = {}) {
  const pattern = new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (await clickTextInScopes(target, pattern, { text, exact, timeout })) return true;
    if (attempt < attempts) {
      console.log(`"${text}" not found (attempt ${attempt}/${attempts}); retrying`);
      await sleep(gapMs);
    }
  }
  return false;
}

async function clickTextInScopes(target, pattern, { text, exact, timeout }) {
  for (const { frame, label } of allScopes(target)) {
    const locators = [
      frame.getByRole('link', { name: pattern }),
      frame.getByText(text, { exact }),
      frame.locator('a, button, span, li, div, td').filter({ hasText: pattern }),
    ];
    for (const locator of locators) {
      const visible = locator.filter({ visible: true });
      if ((await visible.count().catch(() => 0)) === 0) continue;
      try {
        await visible.first().click({ timeout });
        console.log(`Clicked "${text}" in [${label}]`);
        return true;
      } catch {
        // Try the next locator strategy or scope.
      }
    }
  }
  return false;
}

const UNFILLABLE_INPUT_TYPES = /hidden|button|submit|image|checkbox|radio|file/i;

// Best-effort fill of the text control associated with a visible label:
// native label association first, then same-table-cell or document-order
// proximity for unassociated markup. Returns false when nothing was filled.
async function fillLabeledField(target, labelText, value, { exact = false } = {}) {
  for (const { frame, label } of allScopes(target)) {
    if (await tryFill(frame.getByLabel(labelText, { exact }), value, labelText, label)) return true;

    const texts = frame.getByText(labelText, { exact });
    const count = await texts.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const text = texts.nth(i);
      if (!(await text.isVisible().catch(() => false))) continue;
      const candidates = [
        text.locator('xpath=ancestor-or-self::td[1]//input[1] | ancestor-or-self::td[1]//textarea[1]'),
        text.locator('xpath=following::input[1] | following::textarea[1]'),
      ];
      for (const candidate of candidates) {
        if (await tryFill(candidate, value, labelText, label)) return true;
      }
    }
  }
  return false;
}

async function tryFill(locator, value, labelText, scopeLabel) {
  const count = Math.min(await locator.count().catch(() => 0), 3);
  for (let i = 0; i < count; i++) {
    const field = locator.nth(i);
    const type = (await field.getAttribute('type').catch(() => null)) || 'text';
    if (UNFILLABLE_INPUT_TYPES.test(type)) continue;
    if (!(await field.isVisible().catch(() => false))) continue;
    try {
      await field.fill(value);
    } catch {
      // Read-only or otherwise unfillable; try the next candidate.
      continue;
    }
    console.log(`Filled "${labelText}" -> ${JSON.stringify(await field.inputValue().catch(() => null))} in [${scopeLabel}]`);
    return true;
  }
  return false;
}

// Waits until text becomes visible in any page or iframe of the target,
// polling because the frame holding it may not exist yet. Use it to verify
// outcomes after actions; returns false when the timeout elapses.
async function waitTextAnywhere(target, text, { timeout = 10000, pollMs = 250, exact = false } = {}) {
  const deadline = Date.now() + timeout;
  while (true) {
    for (const { frame, label } of allScopes(target)) {
      const visible = frame.getByText(text, { exact }).filter({ visible: true });
      if ((await visible.count().catch(() => 0)) > 0) {
        console.log(`"${text}" appeared in [${label}]`);
        return true;
      }
    }
    if (Date.now() + pollMs > deadline) return false;
    await sleep(pollMs);
  }
}

async function detectDevServers(customPorts = []) {
  const ports = [...new Set([3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234, ...customPorts])];
  const servers = [];
  await Promise.all(ports.map(async port => {
    await new Promise(resolve => {
      const request = http.request({ hostname: 'localhost', port, path: '/', method: 'HEAD', timeout: 500 }, response => {
        if (response.statusCode < 500) servers.push(port);
        response.resume();
        resolve();
      });
      request.on('error', resolve);
      request.on('timeout', () => { request.destroy(); resolve(); });
      request.end();
    });
  }));
  return servers.sort((a, b) => a - b).map(port => `http://localhost:${port}`);
}

module.exports = {
  allScopes,
  clickTextAnywhere,
  createContext,
  detectDevServers,
  fillLabeledField,
  getExtraHeadersFromEnv,
  handleCookieBanner,
  launchBrowser,
  sleep,
  takeScreenshot,
  waitTextAnywhere,
};
