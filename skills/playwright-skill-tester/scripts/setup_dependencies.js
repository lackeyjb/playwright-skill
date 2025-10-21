#!/usr/bin/env node

/**
 * Setup Dependencies for Playwright Skill
 *
 * This script ensures the playwright-skill has all required dependencies installed.
 * It detects the skill location and runs npm install if needed.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { detectTestTarget } = require('./detect_test_target');

const execPromise = util.promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Find the playwright-skill
function findPlaywrightSkill() {
  const testConfig = detectTestTarget();

  for (const target of testConfig.targets) {
    const skillMdPath = path.join(target.path, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      return {
        name: target.name,
        path: target.path,
        mode: testConfig.mode
      };
    }
  }

  return null;
}

// Check if dependencies are installed
function checkDependencies(skillPath) {
  const nodeModulesPath = path.join(skillPath, 'node_modules');
  const packageJsonPath = path.join(skillPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return { hasPackageJson: false, hasNodeModules: false };
  }

  const hasNodeModules = fs.existsSync(nodeModulesPath);

  return { hasPackageJson: true, hasNodeModules };
}

// Install dependencies
async function installDependencies(skillPath) {
  log('\n📦 Installing dependencies...', 'blue');
  log(`   Running: npm install`, 'cyan');
  log(`   Directory: ${skillPath}`, 'cyan');

  try {
    const { stdout, stderr } = await execPromise('npm install', {
      cwd: skillPath,
      maxBuffer: 1024 * 1024 * 10
    });

    if (stdout) {
      log('\n   Output:', 'cyan');
      stdout.split('\n').slice(0, 10).forEach(line => {
        if (line.trim()) log(`   ${line}`, 'reset');
      });
    }

    log('\n✅ Dependencies installed successfully!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Failed to install dependencies', 'red');
    if (error.stderr) {
      log('\n   Error:', 'red');
      error.stderr.split('\n').slice(0, 10).forEach(line => {
        if (line.trim()) log(`   ${line}`, 'reset');
      });
    }
    return false;
  }
}

// Main function
async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('  Playwright Skill - Dependency Setup', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  // Find the skill
  const skill = findPlaywrightSkill();

  if (!skill) {
    log('❌ Cannot find playwright-skill', 'red');
    log('   Please ensure the skill is installed or in the workspace', 'yellow');
    process.exit(1);
  }

  log(`🔍 Found skill: ${skill.name}`, 'magenta');
  log(`   Path: ${skill.path}`, 'cyan');
  log(`   Mode: ${skill.mode}`, 'cyan');

  // Check dependencies
  const depStatus = checkDependencies(skill.path);

  if (!depStatus.hasPackageJson) {
    log('\n⚠️  No package.json found', 'yellow');
    log('   Skill does not require npm dependencies', 'cyan');
    process.exit(0);
  }

  if (depStatus.hasNodeModules) {
    log('\n✅ Dependencies already installed', 'green');
    log('   node_modules/ directory exists', 'cyan');

    // Optionally check if up to date
    const packageJson = JSON.parse(fs.readFileSync(path.join(skill.path, 'package.json'), 'utf8'));
    if (packageJson.dependencies || packageJson.devDependencies) {
      log('\n💡 To update dependencies, run:', 'blue');
      log(`   cd ${skill.path} && npm update`, 'cyan');
    }

    process.exit(0);
  }

  log('\n⚠️  Dependencies not installed', 'yellow');
  log('   node_modules/ directory not found', 'cyan');

  // Install dependencies
  const success = await installDependencies(skill.path);

  if (success) {
    log('\n' + '='.repeat(60), 'blue');
    log('  Setup Complete', 'blue');
    log('='.repeat(60) + '\n', 'blue');
    log('✅ Playwright skill is ready for testing!', 'green');
    process.exit(0);
  } else {
    log('\n' + '='.repeat(60), 'blue');
    log('  Setup Failed', 'blue');
    log('='.repeat(60) + '\n', 'blue');
    log('❌ Could not install dependencies', 'red');
    log('\n💡 Try manually:', 'yellow');
    log(`   cd ${skill.path}`, 'cyan');
    log(`   npm install`, 'cyan');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

// Export for use in other scripts
module.exports = { findPlaywrightSkill, checkDependencies, installDependencies };
