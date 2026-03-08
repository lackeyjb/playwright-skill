#!/usr/bin/env node
/**
 * Playwright E2E Test Runner for CI
 *
 * Runs @playwright/test suites in a target project:
 *   node run.js <project-dir>                         # Run all tests
 *   node run.js <project-dir>/e2e/homepage.spec.ts    # Run specific file
 *   node run.js <project-dir> --headed                # Run with visible browser
 *   node run.js <project-dir> --reporter=html         # Custom reporter
 *   node run.js <project-dir> --grep "login"          # Filter by test name
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Walk up directories to find the project root (first dir with package.json)
 */
function findProjectRoot(startPath) {
  let dir = path.resolve(startPath);

  if (fs.existsSync(dir) && fs.statSync(dir).isFile()) {
    dir = path.dirname(dir);
  }

  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }

  return null;
}

/**
 * Check if @playwright/test is installed in the project
 */
function hasPlaywrightTest(projectDir) {
  return fs.existsSync(
    path.join(projectDir, 'node_modules', '@playwright', 'test', 'package.json'),
  );
}

/**
 * Check if playwright.config.ts/js exists in the project
 */
function findPlaywrightConfig(projectDir) {
  for (const name of ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs']) {
    const p = path.join(projectDir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node run.js <project-dir>                    Run all E2E tests');
  console.log('  node run.js <project-dir>/<spec>.spec.ts     Run a specific spec file');
  console.log('  node run.js <project-dir> --headed           Run with visible browser');
  console.log('  node run.js <project-dir> --grep "name"      Filter tests by name');
  console.log('  node run.js <project-dir> --reporter=html    Use HTML reporter');
  console.log('');
  console.log('Examples:');
  console.log('  node run.js ~/myapp');
  console.log('  node run.js ~/myapp/e2e/auth.spec.ts');
  console.log('  node run.js ~/myapp --headed --grep "login"');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const target = args[0];
  const extraArgs = args.slice(1);

  // Validate target exists
  if (!fs.existsSync(target)) {
    console.error(`Error: Path not found: ${target}`);
    console.error('');
    printUsage();
    process.exit(1);
  }

  const isSpecFile =
    fs.statSync(target).isFile() &&
    (target.endsWith('.spec.ts') || target.endsWith('.spec.js') || target.endsWith('.test.ts') || target.endsWith('.test.js'));

  const projectRoot = findProjectRoot(target);
  if (!projectRoot) {
    console.error(`Error: Could not find project root (no package.json found) for: ${target}`);
    process.exit(1);
  }

  console.log(`Project root: ${projectRoot}`);

  // Check @playwright/test is installed
  if (!hasPlaywrightTest(projectRoot)) {
    console.error('\n@playwright/test is not installed in this project.');
    console.error('Run the following to set it up:\n');
    console.error(`  cd ${projectRoot}`);
    console.error('  npm install --save-dev @playwright/test');
    console.error('  npx playwright install chromium\n');
    process.exit(1);
  }

  const config = findPlaywrightConfig(projectRoot);
  if (!config) {
    console.warn('\nWarning: No playwright.config.ts found in project root.');
    console.warn('Tests will run with default settings. Consider generating a config file.\n');
  } else {
    console.log(`Config: ${path.relative(projectRoot, config)}`);
  }

  // Build: npx playwright test [spec-file] [...extra-args]
  const playwrightArgs = ['playwright', 'test'];

  if (isSpecFile) {
    // Pass path relative to project root
    playwrightArgs.push(path.relative(projectRoot, path.resolve(target)));
  }

  playwrightArgs.push(...extraArgs);

  console.log(`Running: npx ${playwrightArgs.join(' ')}`);
  console.log(`In: ${projectRoot}\n`);
  console.log('─'.repeat(60));

  const result = spawnSync('npx', playwrightArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure CI env is set so playwright applies CI-appropriate settings
      CI: process.env.CI ?? 'true',
    },
  });

  if (result.error) {
    console.error('\nFailed to run playwright:', result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

main();
