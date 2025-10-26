// playwright-helpers.js
// Reusable utility functions for Playwright automation

const { chromium, firefox, webkit } = require('playwright');

/**
 * Launch browser with standard configuration
 * @param {string} browserType - 'chromium', 'firefox', or 'webkit'
 * @param {Object} options - Additional launch options
 */
async function launchBrowser(browserType = 'chromium', options = {}) {
  const defaultOptions = {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  
  const browsers = { chromium, firefox, webkit };
  const browser = browsers[browserType];
  
  if (!browser) {
    throw new Error(`Invalid browser type: ${browserType}`);
  }
  
  return await browser.launch({ ...defaultOptions, ...options });
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
  const defaultOptions = {
    viewport: { width: 1280, height: 720 },
    userAgent: options.mobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      : undefined,
    permissions: options.permissions || [],
    geolocation: options.geolocation,
    locale: options.locale || 'en-US',
    timezoneId: options.timezoneId || 'America/New_York'
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

/**
 * ========================================
 * PLATFORMER GAME TESTING UTILITIES
 * ========================================
 */

/**
 * Wait for game to load and become ready
 * @param {Object} page - Playwright page
 * @param {Object} options - Wait options
 */
async function waitForGameReady(page, options = {}) {
  const canvasSelector = options.canvasSelector || 'canvas';
  const timeout = options.timeout || 10000;

  console.log('⏳ Waiting for game to load...');

  // Wait for canvas element
  await page.waitForSelector(canvasSelector, { timeout });

  // Wait for canvas to have content (non-zero dimensions)
  await page.waitForFunction(
    selector => {
      const canvas = document.querySelector(selector);
      return canvas && canvas.width > 0 && canvas.height > 0;
    },
    canvasSelector,
    { timeout }
  );

  // Additional wait for game initialization
  const initDelay = options.initDelay || 1000;
  await page.waitForTimeout(initDelay);

  console.log('✅ Game loaded and ready');
}

/**
 * Press and hold a key for specified duration
 * @param {Object} page - Playwright page
 * @param {string} key - Key to press (ArrowLeft, ArrowRight, ArrowUp, Space, etc.)
 * @param {number} duration - Duration in milliseconds
 */
async function pressKey(page, key, duration = 100) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

/**
 * Simulate platformer movement
 * @param {Object} page - Playwright page
 * @param {string} direction - 'left', 'right', 'jump', 'up', 'down'
 * @param {number} duration - Duration in milliseconds
 */
async function movePlayer(page, direction, duration = 200) {
  const keyMap = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    jump: 'Space'
  };

  const key = keyMap[direction.toLowerCase()] || direction;
  console.log(`🎮 Moving ${direction} for ${duration}ms`);
  await pressKey(page, key, duration);
}

/**
 * Execute a sequence of game actions
 * @param {Object} page - Playwright page
 * @param {Array} actions - Array of {direction, duration} objects
 */
async function executeActionSequence(page, actions) {
  console.log(`🎯 Executing ${actions.length} actions`);

  for (const action of actions) {
    await movePlayer(page, action.direction, action.duration || 200);
    if (action.wait) {
      await page.waitForTimeout(action.wait);
    }
  }

  console.log('✅ Action sequence completed');
}

/**
 * Get game state from window object or data attributes
 * @param {Object} page - Playwright page
 * @param {Object} options - Options for state extraction
 */
async function getGameState(page, options = {}) {
  return await page.evaluate((opts) => {
    const state = {};

    // Try to extract from common global variables
    if (typeof window.game !== 'undefined') {
      state.game = window.game;
    }
    if (typeof window.player !== 'undefined') {
      state.player = window.player;
    }
    if (typeof window.score !== 'undefined') {
      state.score = window.score;
    }
    if (typeof window.level !== 'undefined') {
      state.level = window.level;
    }

    // Extract from DOM elements if specified
    if (opts.scoreSelector) {
      const scoreEl = document.querySelector(opts.scoreSelector);
      if (scoreEl) state.score = scoreEl.textContent?.trim();
    }
    if (opts.levelSelector) {
      const levelEl = document.querySelector(opts.levelSelector);
      if (levelEl) state.level = levelEl.textContent?.trim();
    }
    if (opts.healthSelector) {
      const healthEl = document.querySelector(opts.healthSelector);
      if (healthEl) state.health = healthEl.textContent?.trim();
    }
    if (opts.livesSelector) {
      const livesEl = document.querySelector(opts.livesSelector);
      if (livesEl) state.lives = livesEl.textContent?.trim();
    }

    return state;
  }, options);
}

/**
 * Check if game over screen is shown
 * @param {Object} page - Playwright page
 * @param {Object} options - Detection options
 */
async function isGameOver(page, options = {}) {
  return await page.evaluate((opts) => {
    // Check for common game over indicators
    const gameOverSelectors = [
      '.game-over',
      '#game-over',
      '[data-state="game-over"]',
      '.gameover',
      ...(opts.customSelectors || [])
    ];

    for (const selector of gameOverSelectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) { // visible check
        return true;
      }
    }

    // Check for game over text
    const gameOverTexts = ['game over', 'you died', 'try again'];
    const bodyText = document.body.textContent?.toLowerCase() || '';

    for (const text of gameOverTexts) {
      if (bodyText.includes(text)) {
        return true;
      }
    }

    // Check global state
    if (opts.checkGlobal && typeof window.gameState !== 'undefined') {
      return window.gameState === 'gameover' || window.gameState === 'game-over';
    }

    return false;
  }, options);
}

/**
 * Check if level is complete
 * @param {Object} page - Playwright page
 * @param {Object} options - Detection options
 */
async function isLevelComplete(page, options = {}) {
  return await page.evaluate((opts) => {
    // Check for level complete indicators
    const completeSelectors = [
      '.level-complete',
      '.victory',
      '.win',
      '#level-complete',
      '[data-state="complete"]',
      ...(opts.customSelectors || [])
    ];

    for (const selector of completeSelectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        return true;
      }
    }

    // Check for victory text
    const victoryTexts = ['level complete', 'you win', 'victory', 'well done', 'next level'];
    const bodyText = document.body.textContent?.toLowerCase() || '';

    for (const text of victoryTexts) {
      if (bodyText.includes(text)) {
        return true;
      }
    }

    // Check global state
    if (opts.checkGlobal && typeof window.levelState !== 'undefined') {
      return window.levelState === 'complete' || window.levelState === 'victory';
    }

    return false;
  }, options);
}

/**
 * Monitor game FPS/performance
 * @param {Object} page - Playwright page
 * @param {number} duration - Duration to monitor in milliseconds
 */
async function monitorPerformance(page, duration = 5000) {
  console.log(`📊 Monitoring performance for ${duration}ms...`);

  const metrics = await page.evaluate((monitorDuration) => {
    return new Promise((resolve) => {
      const fps = [];
      let lastTime = performance.now();
      let frameCount = 0;

      const measureFPS = () => {
        const currentTime = performance.now();
        frameCount++;

        if (currentTime >= lastTime + 1000) {
          fps.push(frameCount);
          frameCount = 0;
          lastTime = currentTime;
        }
      };

      const rafId = setInterval(() => {
        requestAnimationFrame(measureFPS);
      }, 16); // ~60fps

      setTimeout(() => {
        clearInterval(rafId);

        const avgFPS = fps.length > 0
          ? Math.round(fps.reduce((a, b) => a + b, 0) / fps.length)
          : 0;
        const minFPS = fps.length > 0 ? Math.min(...fps) : 0;
        const maxFPS = fps.length > 0 ? Math.max(...fps) : 0;

        resolve({
          averageFPS: avgFPS,
          minFPS,
          maxFPS,
          samples: fps
        });
      }, monitorDuration);
    });
  }, duration);

  console.log(`📈 Performance: Avg ${metrics.averageFPS} FPS (Min: ${metrics.minFPS}, Max: ${metrics.maxFPS})`);
  return metrics;
}

/**
 * Take screenshot of game canvas
 * @param {Object} page - Playwright page
 * @param {string} name - Screenshot name
 * @param {Object} options - Screenshot options
 */
async function captureGameScreen(page, name, options = {}) {
  const canvasSelector = options.canvasSelector || 'canvas';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `/tmp/${name}-${timestamp}.png`;

  try {
    // Try to screenshot just the canvas
    const canvas = await page.locator(canvasSelector).first();
    await canvas.screenshot({ path: filename });
  } catch (e) {
    // Fallback to full page screenshot
    await page.screenshot({ path: filename });
  }

  console.log(`📸 Game screenshot saved: ${filename}`);
  return filename;
}

/**
 * Simulate double jump
 * @param {Object} page - Playwright page
 * @param {number} firstJumpDuration - Duration of first jump press
 * @param {number} delay - Delay between jumps
 * @param {number} secondJumpDuration - Duration of second jump press
 */
async function doubleJump(page, firstJumpDuration = 100, delay = 200, secondJumpDuration = 100) {
  console.log('🎮 Executing double jump');
  await pressKey(page, 'Space', firstJumpDuration);
  await page.waitForTimeout(delay);
  await pressKey(page, 'Space', secondJumpDuration);
}

/**
 * Execute a combo move (e.g., run + jump)
 * @param {Object} page - Playwright page
 * @param {Array} keys - Array of keys to press simultaneously
 * @param {number} duration - Duration to hold the combo
 */
async function executeCombo(page, keys, duration = 300) {
  console.log(`🎮 Executing combo: ${keys.join(' + ')}`);

  // Press all keys down
  for (const key of keys) {
    await page.keyboard.down(key);
  }

  // Hold for duration
  await page.waitForTimeout(duration);

  // Release all keys
  for (const key of keys) {
    await page.keyboard.up(key);
  }
}

/**
 * Wait for specific game event or condition
 * @param {Object} page - Playwright page
 * @param {Function} condition - Condition function to evaluate
 * @param {Object} options - Wait options
 */
async function waitForGameCondition(page, condition, options = {}) {
  const timeout = options.timeout || 10000;
  const pollInterval = options.pollInterval || 100;

  return await page.waitForFunction(
    condition,
    { timeout, polling: pollInterval }
  );
}

/**
 * Extract score/stats from game UI
 * @param {Object} page - Playwright page
 * @param {Object} selectors - Selectors for various stats
 */
async function extractGameStats(page, selectors = {}) {
  return await page.evaluate((sels) => {
    const stats = {};

    const defaultSelectors = {
      score: '.score, #score, [data-stat="score"]',
      level: '.level, #level, [data-stat="level"]',
      health: '.health, #health, [data-stat="health"]',
      lives: '.lives, #lives, [data-stat="lives"]',
      coins: '.coins, #coins, [data-stat="coins"]',
      time: '.timer, #timer, [data-stat="time"]',
      ...sels
    };

    for (const [key, selector] of Object.entries(defaultSelectors)) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent?.trim();
        // Try to extract numeric value
        const numMatch = text?.match(/\d+/);
        stats[key] = numMatch ? parseInt(numMatch[0]) : text;
      }
    }

    return stats;
  }, selectors);
}

/**
 * Test basic player controls
 * @param {Object} page - Playwright page
 * @param {Object} options - Test options
 */
async function testPlayerControls(page, options = {}) {
  console.log('🧪 Testing player controls...');

  const tests = [];
  const movements = ['left', 'right', 'jump'];

  for (const direction of movements) {
    try {
      await movePlayer(page, direction, 300);
      await page.waitForTimeout(200);
      tests.push({ control: direction, passed: true });
      console.log(`  ✅ ${direction} control works`);
    } catch (e) {
      tests.push({ control: direction, passed: false, error: e.message });
      console.log(`  ❌ ${direction} control failed: ${e.message}`);
    }
  }

  return tests;
}

/**
 * Check if element is present in game (e.g., collectible, enemy, platform)
 * @param {Object} page - Playwright page
 * @param {string} selector - Selector for the element
 */
async function checkGameElement(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el !== null && el.offsetParent !== null;
  }, selector);
}

module.exports = {
  // Original utilities
  launchBrowser,
  createPage,
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
  createContext,
  detectDevServers,

  // Platformer game testing utilities
  waitForGameReady,
  pressKey,
  movePlayer,
  executeActionSequence,
  getGameState,
  isGameOver,
  isLevelComplete,
  monitorPerformance,
  captureGameScreen,
  doubleJump,
  executeCombo,
  waitForGameCondition,
  extractGameStats,
  testPlayerControls,
  checkGameElement
};
