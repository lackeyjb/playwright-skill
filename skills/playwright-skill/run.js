#!/usr/bin/env node
/**
 * Universal Playwright Executor for Claude Code
 *
 * Executes Playwright automation code from:
 * - File path: node run.js script.js
 * - Inline code: node run.js 'await page.goto("...")'
 * - Stdin: cat script.js | node run.js
 *
 * Ensures proper module resolution by running from skill directory.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Change to skill directory for proper module resolution
process.chdir(__dirname);

/**
 * Check if Playwright is installed
 */
function checkPlaywrightInstalled() {
  try {
    require.resolve('playwright');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Install Playwright if missing
 * Installs browsers based on config (chromium by default, but respects channel/executablePath)
 */
function installPlaywright() {
  console.log('📦 Playwright not found. Installing...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });

    // Check if user has a config with channel or executablePath
    // If so, they may be using an installed browser and don't need Playwright's browsers
    let browserType = 'chromium';
    let skipBrowserInstall = false;

    try {
      const helpers = require('./lib/helpers');
      const config = helpers.readBrowserConfig();

      if (config.executablePath) {
        console.log('📋 Config specifies executablePath - skipping browser download');
        skipBrowserInstall = true;
      } else if (config.browser) {
        browserType = config.browser;
      }
    } catch (configErr) {
      // Config reading failed, use defaults
    }

    if (!skipBrowserInstall) {
      console.log(`📦 Installing ${browserType} browser...`);
      // Browser type is from config validation (only chromium/firefox/webkit allowed)
      execSync(`npx playwright install ${browserType}`, { stdio: 'inherit', cwd: __dirname });
    }

    console.log('✅ Playwright installed successfully');
    return true;
  } catch (e) {
    console.error('❌ Failed to install Playwright:', e.message);
    console.error('Please run manually: cd', __dirname, '&& npm run setup');
    return false;
  }
}

/**
 * Get code to execute from various sources
 */
function getCodeToExecute() {
  const args = process.argv.slice(2);

  // Case 1: File path provided
  if (args.length > 0 && fs.existsSync(args[0])) {
    const filePath = path.resolve(args[0]);
    console.log(`📄 Executing file: ${filePath}`);
    return fs.readFileSync(filePath, 'utf8');
  }

  // Case 2: Inline code provided as argument
  if (args.length > 0) {
    console.log('⚡ Executing inline code');
    return args.join(' ');
  }

  // Case 3: Code from stdin
  if (!process.stdin.isTTY) {
    console.log('📥 Reading from stdin');
    return fs.readFileSync(0, 'utf8');
  }

  // No input
  console.error('❌ No code to execute');
  console.error('Usage:');
  console.error('  node run.js script.js          # Execute file');
  console.error('  node run.js "code here"        # Execute inline');
  console.error('  cat script.js | node run.js    # Execute from stdin');
  process.exit(1);
}

/**
 * Clean up old temporary execution files from previous runs
 */
function cleanupOldTempFiles() {
  try {
    const files = fs.readdirSync(__dirname);
    const tempFiles = files.filter(f => f.startsWith('.temp-execution-') && f.endsWith('.js'));

    if (tempFiles.length > 0) {
      tempFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // Ignore errors - file might be in use or already deleted
        }
      });
    }
  } catch (e) {
    // Ignore directory read errors
  }
}

/**
 * Wrap code in async IIFE if not already wrapped
 */
function wrapCodeIfNeeded(code) {
  // Check if code already has require() and async structure
  const hasRequire = code.includes('require(');
  const hasAsyncIIFE = code.includes('(async () => {') || code.includes('(async()=>{');

  // If it's already a complete script, return as-is
  if (hasRequire && hasAsyncIIFE) {
    return code;
  }

  // If it's just Playwright commands, wrap in full template
  if (!hasRequire) {
    return `
const { chromium, firefox, webkit, devices } = require('playwright');
const helpers = require('./lib/helpers');

// Browser configuration from .claude/playwright.local.json (if exists)
const __browserConfig = helpers.readBrowserConfig();

// Extra headers from environment variables (if configured)
const __extraHeaders = helpers.getExtraHeadersFromEnv();

/**
 * Get browser configuration from .claude/playwright.local.json
 * Returns: { browser, channel, headless, executablePath, slowMo }
 */
function getBrowserConfig() {
  return __browserConfig;
}

/**
 * Launch browser using configuration from .claude/playwright.local.json
 * Automatically uses configured browser type, channel, and executable path.
 * @param {Object} options - Additional options to override config
 */
async function launchConfiguredBrowser(options = {}) {
  const config = { ...__browserConfig, ...options };
  const browsers = { chromium, firefox, webkit };
  const browserType = config.browser || 'chromium';
  const browser = browsers[browserType];

  if (!browser) {
    throw new Error(\`Invalid browser type: \${browserType}\`);
  }

  const launchOptions = {
    headless: config.headless !== undefined ? config.headless : false,
    slowMo: config.slowMo || 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (config.channel && browserType === 'chromium') {
    launchOptions.channel = config.channel;
    console.log(\`🌐 Using browser channel: \${config.channel}\`);
  }

  if (config.executablePath) {
    launchOptions.executablePath = config.executablePath;
    console.log(\`🌐 Using browser executable: \${config.executablePath}\`);
  }

  console.log(\`🎭 Launching \${browserType}\${launchOptions.headless ? ' (headless)' : ''}\`);
  return await browser.launch(launchOptions);
}

/**
 * Utility to merge environment headers into context options.
 * Use when creating contexts with raw Playwright API instead of helpers.createContext().
 * @param {Object} options - Context options
 * @returns {Object} Options with extraHTTPHeaders merged in
 */
function getContextOptionsWithHeaders(options = {}) {
  if (!__extraHeaders) return options;
  return {
    ...options,
    extraHTTPHeaders: {
      ...__extraHeaders,
      ...(options.extraHTTPHeaders || {})
    }
  };
}

(async () => {
  try {
    ${code}
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`;
  }

  // If has require but no async wrapper
  if (!hasAsyncIIFE) {
    return `
(async () => {
  try {
    ${code}
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`;
  }

  return code;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎭 Playwright Skill - Universal Executor\n');

  // Clean up old temp files from previous runs
  cleanupOldTempFiles();

  // Check Playwright installation
  if (!checkPlaywrightInstalled()) {
    const installed = installPlaywright();
    if (!installed) {
      process.exit(1);
    }
  }

  // Get code to execute
  const rawCode = getCodeToExecute();
  const code = wrapCodeIfNeeded(rawCode);

  // Create temporary file for execution
  const tempFile = path.join(__dirname, `.temp-execution-${Date.now()}.js`);

  try {
    // Write code to temp file
    fs.writeFileSync(tempFile, code, 'utf8');

    // Execute the code
    console.log('🚀 Starting automation...\n');
    require(tempFile);

    // Note: Temp file will be cleaned up on next run
    // This allows long-running async operations to complete safely

  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
