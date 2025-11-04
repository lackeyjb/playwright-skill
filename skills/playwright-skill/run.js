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
 * Clean up old files matching a pattern
 * @param {Object} options - Cleanup options
 * @param {string} options.directory - Directory to clean (defaults to __dirname)
 * @param {Function} options.filter - Filter function to match files
 * @param {number} options.ageThresholdHours - Only delete files older than this (optional)
 * @param {boolean} options.silent - Suppress console output (default: true)
 * @returns {Object} Cleanup statistics
 */
function cleanupOldFiles(options = {}) {
  const {
    directory = __dirname,
    filter,
    ageThresholdHours = null,
    silent = true
  } = options;

  const stats = {
    filesDeleted: 0,
    spaceFreed: 0
  };

  try {
    const files = fs.readdirSync(directory);
    const matchingFiles = filter ? files.filter(filter) : files;

    if (matchingFiles.length > 0) {
      const now = Date.now();
      const ageThreshold = ageThresholdHours ? now - (ageThresholdHours * 60 * 60 * 1000) : null;

      matchingFiles.forEach(file => {
        const filePath = path.join(directory, file);
        try {
          const fileStats = fs.statSync(filePath);

          // Check age threshold if specified
          if (ageThreshold && fileStats.mtime.getTime() >= ageThreshold) {
            return; // Skip files that are too new
          }

          stats.spaceFreed += fileStats.size;
          fs.unlinkSync(filePath);
          stats.filesDeleted++;
        } catch (e) {
          // Ignore errors - file might be in use or already deleted
        }
      });

      // Log results if not silent
      if (!silent && stats.filesDeleted > 0) {
        const freedMB = (stats.spaceFreed / 1024 / 1024).toFixed(2);
        const ageInfo = ageThresholdHours ? ` (${ageThresholdHours}+ hours old)` : '';
        console.log(`🗑️  Cleaned up ${stats.filesDeleted} files${ageInfo}, freed ${freedMB}MB`);
      }
    }
  } catch (e) {
    // Ignore directory read errors
  }

  return stats;
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
  cleanupOldFiles({
    directory: __dirname,
    filter: f => f.startsWith('.temp-execution-') && f.endsWith('.js'),
    silent: true
  });

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

// Export cleanup function for use in helpers
module.exports = { cleanupOldFiles };

// Run main function only if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
