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
 */
function installPlaywright() {
  console.log('📦 Playwright not found. Installing...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    execSync('npx playwright install chromium', { stdio: 'inherit', cwd: __dirname });
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
 * Wrap code in async IIFE if not already wrapped.
 * Adds automatic browser cleanup and execution timeout.
 */
function wrapCodeIfNeeded(code) {
  // Check if code already has require() and async structure
  const hasRequire = code.includes('require(');
  const hasAsyncIIFE = code.includes('(async () => {') || code.includes('(async()=>{');

  // Build the auto-cleanup wrapper that kills any leftover browser processes
  const autoCleanup = `
// --- Auto cleanup: close any browser launched by this script ---
const __launchedBrowsers = [];
const __origChromiumLaunch = typeof chromium !== 'undefined' ? chromium.launch.bind(chromium) : null;
if (__origChromiumLaunch) {
  chromium.launch = async function(...args) {
    const b = await __origChromiumLaunch(...args);
    __launchedBrowsers.push(b);
    return b;
  };
}
async function __cleanupBrowsers() {
  for (const b of __launchedBrowsers) {
    try { await b.close(); } catch (e) { /* already closed */ }
  }
}
`;

  // If it's already a complete script, inject cleanup wrappers
  if (hasRequire && hasAsyncIIFE) {
    // Inject browser tracking after require statements
    const patchedCode = code.replace(
      /(const\s*\{[^}]*\}\s*=\s*require\(['"]playwright['"]\);?)/,
      `$1\n${autoCleanup}`
    );
    // Add cleanup on process exit signals
    if (!patchedCode.includes('__cleanupBrowsers')) {
      return code; // couldn't patch, return as-is
    }
    // Ensure cleanup on SIGINT/SIGTERM and process.exit
    const signalHandlers = `
process.on('SIGINT', async () => { await __cleanupBrowsers(); process.exit(130); });
process.on('SIGTERM', async () => { await __cleanupBrowsers(); process.exit(143); });
`;
    return patchedCode.replace('(async () => {', signalHandlers + '(async () => {');
  }

  // If it's just Playwright commands, wrap in full template with cleanup
  if (!hasRequire) {
    return `
const { chromium, firefox, webkit, devices } = require('playwright');
const helpers = require('./lib/helpers');

// Extra headers from environment variables (if configured)
const __extraHeaders = helpers.getExtraHeadersFromEnv();

${autoCleanup}

// Ensure cleanup on signals
process.on('SIGINT', async () => { await __cleanupBrowsers(); process.exit(130); });
process.on('SIGTERM', async () => { await __cleanupBrowsers(); process.exit(143); });

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

// Execution timeout (default 120s, configurable via PW_TIMEOUT env)
const __timeout = setTimeout(() => {
  console.error('⏰ Execution timed out. Cleaning up...');
  __cleanupBrowsers().finally(() => process.exit(124));
}, parseInt(process.env.PW_TIMEOUT || '120000', 10));

(async () => {
  try {
    ${code}
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    clearTimeout(__timeout);
    await __cleanupBrowsers();
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
  } finally {
    await __cleanupBrowsers();
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
