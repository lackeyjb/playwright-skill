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
    locale: 'en-US',
    timezoneId: 'America/New_York',
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
  createContext,
  detectDevServers,
  getExtraHeadersFromEnv,
  handleCookieBanner,
  launchBrowser,
  takeScreenshot,
};
