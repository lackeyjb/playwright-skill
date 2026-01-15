// playwright-helpers.js
// Reusable utility functions for Playwright automation

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Read browser configuration from .claude/playwright.local.md
 * Searches from current working directory upward to find config file.
 *
 * Config file format (YAML frontmatter):
 * ---
 * browser: chromium | firefox | webkit
 * channel: chrome | msedge | chrome-beta | msedge-beta | brave
 * headless: true | false
 * executablePath: /path/to/browser
 * slowMo: 100
 * ---
 *
 * @param {string} startDir - Directory to start searching from (defaults to cwd)
 * @returns {Object} Browser configuration with defaults applied
 */
function readBrowserConfig(startDir = process.cwd()) {
  const defaults = {
    browser: 'chromium',
    channel: null,
    headless: false,
    executablePath: null,
    slowMo: 0
  };

  const configPath = findConfigFile(startDir);
  if (!configPath) {
    return defaults;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = parseYamlFrontmatter(content);

    console.log(`📋 Loaded browser config from: ${configPath}`);

    // Merge with defaults, only including valid options
    const merged = { ...defaults };

    if (config.browser && ['chromium', 'firefox', 'webkit'].includes(config.browser)) {
      merged.browser = config.browser;
    }

    if (config.channel) {
      merged.channel = config.channel;
    }

    if (typeof config.headless === 'boolean') {
      merged.headless = config.headless;
    }

    if (config.executablePath) {
      merged.executablePath = config.executablePath;
    }

    if (typeof config.slowMo === 'number') {
      merged.slowMo = config.slowMo;
    }

    return merged;
  } catch (e) {
    console.warn(`⚠️ Failed to read config file: ${e.message}`);
    return defaults;
  }
}

/**
 * Find playwright.local.md config file by searching upward from startDir
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} Path to config file or null if not found
 */
function findConfigFile(startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const configPath = path.join(currentDir, '.claude', 'playwright.local.md');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} content - File content with optional YAML frontmatter
 * @returns {Object} Parsed frontmatter or empty object
 */
function parseYamlFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return {};
  }

  const yaml = frontmatterMatch[1];
  const result = {};

  // Simple YAML parser for key: value pairs
  const lines = yaml.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();

      // Parse value types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null' || value === '') value = null;
      else if (/^\d+$/.test(value)) value = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
      // Remove quotes if present
      else if ((value.startsWith('"') && value.endsWith('"')) ||
               (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Parse extra HTTP headers from environment variables.
 * Supports two formats:
 * - PW_HEADER_NAME + PW_HEADER_VALUE: Single header (simple, common case)
 * - PW_EXTRA_HEADERS: JSON object for multiple headers (advanced)
 * Single header format takes precedence if both are set.
 * @returns {Object|null} Headers object or null if none configured
 */
function getExtraHeadersFromEnv() {
  const headerName = process.env.PW_HEADER_NAME;
  const headerValue = process.env.PW_HEADER_VALUE;

  if (headerName && headerValue) {
    return { [headerName]: headerValue };
  }

  const headersJson = process.env.PW_EXTRA_HEADERS;
  if (headersJson) {
    try {
      const parsed = JSON.parse(headersJson);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      console.warn('PW_EXTRA_HEADERS must be a JSON object, ignoring...');
    } catch (e) {
      console.warn('Failed to parse PW_EXTRA_HEADERS as JSON:', e.message);
    }
  }

  return null;
}

/**
 * Launch browser with configuration from .claude/playwright.local.md or options
 *
 * Supports Chromium channels for using installed browsers like:
 * - 'chrome' (Google Chrome)
 * - 'chrome-beta', 'chrome-dev', 'chrome-canary'
 * - 'msedge' (Microsoft Edge)
 * - 'msedge-beta', 'msedge-dev'
 * - 'brave' (Brave Browser) - requires executablePath on most systems
 *
 * @param {string} browserType - 'chromium', 'firefox', or 'webkit' (can be overridden by config)
 * @param {Object} options - Additional launch options
 * @param {string} options.channel - Browser channel (chrome, msedge, brave, etc.)
 * @param {string} options.executablePath - Custom browser executable path
 * @param {boolean} options.useConfig - Whether to read from config file (default: true)
 */
async function launchBrowser(browserType = 'chromium', options = {}) {
  // Read config from .claude/playwright.local.md unless disabled
  const config = options.useConfig !== false ? readBrowserConfig() : {};

  // Merge config with options (options take precedence)
  const effectiveBrowserType = options.browser || config.browser || browserType;
  const effectiveChannel = options.channel || config.channel || null;
  const effectiveHeadless = options.headless !== undefined
    ? options.headless
    : (config.headless !== undefined ? config.headless : (process.env.HEADLESS !== 'false'));
  const effectiveSlowMo = options.slowMo !== undefined
    ? options.slowMo
    : (config.slowMo || (process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0));
  const effectiveExecutablePath = options.executablePath || config.executablePath || null;

  const launchOptions = {
    headless: effectiveHeadless,
    slowMo: effectiveSlowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...options
  };

  // Add channel if specified (only works with chromium)
  if (effectiveChannel && effectiveBrowserType === 'chromium') {
    launchOptions.channel = effectiveChannel;
    console.log(`🌐 Using browser channel: ${effectiveChannel}`);
  }

  // Add executablePath if specified
  if (effectiveExecutablePath) {
    launchOptions.executablePath = effectiveExecutablePath;
    console.log(`🌐 Using browser executable: ${effectiveExecutablePath}`);
  }

  // Remove helper options that aren't valid Playwright options
  delete launchOptions.useConfig;
  delete launchOptions.browser;

  const browsers = { chromium, firefox, webkit };
  const browser = browsers[effectiveBrowserType];

  if (!browser) {
    throw new Error(`Invalid browser type: ${effectiveBrowserType}. Valid types: chromium, firefox, webkit`);
  }

  console.log(`🎭 Launching ${effectiveBrowserType}${effectiveHeadless ? ' (headless)' : ''}`);
  return await browser.launch(launchOptions);
}

/**
 * Create a new page with viewport and user agent
 * @param {Object} context - Browser context
 * @param {Object} options - Page options
 */
async function createPage(context, options = {}) {
  const page = await context.newPage();
  
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  
  if (options.userAgent) {
    await page.setExtraHTTPHeaders({
      'User-Agent': options.userAgent
    });
  }
  
  // Set default timeout
  page.setDefaultTimeout(options.timeout || 30000);
  
  return page;
}

/**
 * Smart wait for page to be ready
 * @param {Object} page - Playwright page
 * @param {Object} options - Wait options
 */
async function waitForPageReady(page, options = {}) {
  const waitOptions = {
    waitUntil: options.waitUntil || 'networkidle',
    timeout: options.timeout || 30000
  };
  
  try {
    await page.waitForLoadState(waitOptions.waitUntil, { 
      timeout: waitOptions.timeout 
    });
  } catch (e) {
    console.warn('Page load timeout, continuing...');
  }
  
  // Additional wait for dynamic content if selector provided
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { 
      timeout: options.timeout 
    });
  }
}

/**
 * Safe click with retry logic
 * @param {Object} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Click options
 */
async function safeClick(page, selector, options = {}) {
  const maxRetries = options.retries || 3;
  const retryDelay = options.retryDelay || 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { 
        state: 'visible',
        timeout: options.timeout || 5000 
      });
      await page.click(selector, {
        force: options.force || false,
        timeout: options.timeout || 5000
      });
      return true;
    } catch (e) {
      if (i === maxRetries - 1) {
        console.error(`Failed to click ${selector} after ${maxRetries} attempts`);
        throw e;
      }
      console.log(`Retry ${i + 1}/${maxRetries} for clicking ${selector}`);
      await page.waitForTimeout(retryDelay);
    }
  }
}

/**
 * Safe text input with clear before type
 * @param {Object} page - Playwright page
 * @param {string} selector - Input selector
 * @param {string} text - Text to type
 * @param {Object} options - Type options
 */
async function safeType(page, selector, text, options = {}) {
  await page.waitForSelector(selector, { 
    state: 'visible',
    timeout: options.timeout || 10000 
  });
  
  if (options.clear !== false) {
    await page.fill(selector, '');
  }
  
  if (options.slow) {
    await page.type(selector, text, { delay: options.delay || 100 });
  } else {
    await page.fill(selector, text);
  }
}

/**
 * Extract text from multiple elements
 * @param {Object} page - Playwright page
 * @param {string} selector - Elements selector
 */
async function extractTexts(page, selector) {
  await page.waitForSelector(selector, { timeout: 10000 });
  return await page.$$eval(selector, elements => 
    elements.map(el => el.textContent?.trim()).filter(Boolean)
  );
}

/**
 * Take screenshot with timestamp
 * @param {Object} page - Playwright page
 * @param {string} name - Screenshot name
 * @param {Object} options - Screenshot options
 */
async function takeScreenshot(page, name, options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  
  await page.screenshot({
    path: filename,
    fullPage: options.fullPage !== false,
    ...options
  });
  
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Handle authentication
 * @param {Object} page - Playwright page
 * @param {Object} credentials - Username and password
 * @param {Object} selectors - Login form selectors
 */
async function authenticate(page, credentials, selectors = {}) {
  const defaultSelectors = {
    username: 'input[name="username"], input[name="email"], #username, #email',
    password: 'input[name="password"], #password',
    submit: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
  };
  
  const finalSelectors = { ...defaultSelectors, ...selectors };
  
  await safeType(page, finalSelectors.username, credentials.username);
  await safeType(page, finalSelectors.password, credentials.password);
  await safeClick(page, finalSelectors.submit);
  
  // Wait for navigation or success indicator
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.waitForSelector(selectors.successIndicator || '.dashboard, .user-menu, .logout', { timeout: 10000 })
  ]).catch(() => {
    console.log('Login might have completed without navigation');
  });
}

/**
 * Scroll page
 * @param {Object} page - Playwright page
 * @param {string} direction - 'down', 'up', 'top', 'bottom'
 * @param {number} distance - Pixels to scroll (for up/down)
 */
async function scrollPage(page, direction = 'down', distance = 500) {
  switch (direction) {
    case 'down':
      await page.evaluate(d => window.scrollBy(0, d), distance);
      break;
    case 'up':
      await page.evaluate(d => window.scrollBy(0, -d), distance);
      break;
    case 'top':
      await page.evaluate(() => window.scrollTo(0, 0));
      break;
    case 'bottom':
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      break;
  }
  await page.waitForTimeout(500); // Wait for scroll animation
}

/**
 * Extract table data
 * @param {Object} page - Playwright page
 * @param {string} tableSelector - Table selector
 */
async function extractTableData(page, tableSelector) {
  await page.waitForSelector(tableSelector);
  
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return null;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => 
      th.textContent?.trim()
    );
    
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (headers.length > 0) {
        return cells.reduce((obj, cell, index) => {
          obj[headers[index] || `column_${index}`] = cell.textContent?.trim();
          return obj;
        }, {});
      } else {
        return cells.map(cell => cell.textContent?.trim());
      }
    });
    
    return { headers, rows };
  }, tableSelector);
}

/**
 * Wait for and dismiss cookie banners
 * @param {Object} page - Playwright page
 * @param {number} timeout - Max time to wait
 */
async function handleCookieBanner(page, timeout = 3000) {
  const commonSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("I agree")',
    '.cookie-accept',
    '#cookie-accept',
    '[data-testid="cookie-accept"]'
  ];
  
  for (const selector of commonSelectors) {
    try {
      const element = await page.waitForSelector(selector, { 
        timeout: timeout / commonSelectors.length,
        state: 'visible'
      });
      if (element) {
        await element.click();
        console.log('Cookie banner dismissed');
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create browser context with common settings
 * @param {Object} browser - Browser instance
 * @param {Object} options - Context options
 */
async function createContext(browser, options = {}) {
  const envHeaders = getExtraHeadersFromEnv();

  // Merge environment headers with any passed in options
  const mergedHeaders = {
    ...envHeaders,
    ...options.extraHTTPHeaders
  };

  const defaultOptions = {
    viewport: { width: 1280, height: 720 },
    userAgent: options.mobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      : undefined,
    permissions: options.permissions || [],
    geolocation: options.geolocation,
    locale: options.locale || 'en-US',
    timezoneId: options.timezoneId || 'America/New_York',
    // Only include extraHTTPHeaders if we have any
    ...(Object.keys(mergedHeaders).length > 0 && { extraHTTPHeaders: mergedHeaders })
  };

  return await browser.newContext({ ...defaultOptions, ...options });
}

/**
 * Detect running dev servers on common ports
 * @param {Array<number>} customPorts - Additional ports to check
 * @returns {Promise<Array>} Array of detected server URLs
 */
async function detectDevServers(customPorts = []) {
  const http = require('http');

  // Common dev server ports
  const commonPorts = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234];
  const allPorts = [...new Set([...commonPorts, ...customPorts])];

  const detectedServers = [];

  console.log('🔍 Checking for running dev servers...');

  for (const port of allPorts) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 500
        }, (res) => {
          if (res.statusCode < 500) {
            detectedServers.push(`http://localhost:${port}`);
            console.log(`  ✅ Found server on port ${port}`);
          }
          resolve();
        });

        req.on('error', () => resolve());
        req.on('timeout', () => {
          req.destroy();
          resolve();
        });

        req.end();
      });
    } catch (e) {
      // Port not available, continue
    }
  }

  if (detectedServers.length === 0) {
    console.log('  ❌ No dev servers detected');
  }

  return detectedServers;
}

module.exports = {
  // Browser configuration
  readBrowserConfig,
  findConfigFile,
  parseYamlFrontmatter,
  // Browser management
  launchBrowser,
  createPage,
  createContext,
  // Page utilities
  waitForPageReady,
  safeClick,
  safeType,
  extractTexts,
  takeScreenshot,
  authenticate,
  scrollPage,
  extractTableData,
  handleCookieBanner,
  retryWithBackoff,
  // Server detection
  detectDevServers,
  // Headers
  getExtraHeadersFromEnv
};
