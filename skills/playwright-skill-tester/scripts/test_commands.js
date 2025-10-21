#!/usr/bin/env node

/**
 * Test Commands for Playwright Skill
 *
 * This script:
 * 1. Extracts all command examples from SKILL.md
 * 2. Verifies they use $SKILL_DIR (not hardcoded paths)
 * 3. Tests command syntax is valid
 * 4. Optionally executes safe commands to verify they work
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { detectTestTarget } = require('./detect_test_target');
const { validateCommand, sanitizeCommand, logValidation } = require('./shared/utils');

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

function testResult(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColor = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
  return passed;
}

// Find the playwright-skill installation
function findPlaywrightSkill() {
  const testConfig = detectTestTarget();

  for (const target of testConfig.targets) {
    const skillMdPath = path.join(target.path, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      return {
        skillPath: target.path,
        skillMdPath: skillMdPath,
        mode: testConfig.mode
      };
    }
  }

  return null;
}

// Extract code blocks from markdown
function extractCodeBlocks(content) {
  const codeBlockRegex = /```(?:bash|javascript|js)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

// Extract commands that use paths
function extractPathCommands(codeBlocks) {
  const commands = [];

  codeBlocks.forEach((block, index) => {
    const lines = block.split('\n');

    lines.forEach((line, lineIndex) => {
      line = line.trim();

      // Skip comments and empty lines
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        return;
      }

      // Look for commands with paths
      if (line.includes('cd ') || line.includes('$SKILL_DIR') || line.includes('/.claude/')) {
        commands.push({
          blockIndex: index,
          lineIndex: lineIndex,
          command: line,
          hasSkillDir: line.includes('$SKILL_DIR'),
          hasHardcodedPath: /cd\s+~\/\.claude\/skills\/playwright-skill(?!.*\$SKILL_DIR)/.test(line)
        });
      }
    });
  });

  return commands;
}

// Test 1: Extract and analyze commands
function testCommandExtraction(skillMdPath) {
  log('\n📝 Test 1: Command Extraction and Analysis', 'yellow');

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const codeBlocks = extractCodeBlocks(content);

  testResult('Code blocks extracted', codeBlocks.length > 0, `Found ${codeBlocks.length} code blocks`);

  const pathCommands = extractPathCommands(codeBlocks);
  testResult('Path commands identified', pathCommands.length > 0, `Found ${pathCommands.length} commands with paths`);

  return { content, codeBlocks, pathCommands };
}

// Test 2: Verify commands use $SKILL_DIR
function testSkillDirUsage(pathCommands) {
  log('\n🎯 Test 2: $SKILL_DIR Usage in Commands', 'yellow');

  const commandsWithSkillDir = pathCommands.filter(cmd => cmd.hasSkillDir);
  const commandsWithHardcoded = pathCommands.filter(cmd => cmd.hasHardcodedPath);

  log(`   Commands using $SKILL_DIR: ${commandsWithSkillDir.length}`, 'cyan');
  log(`   Commands with hardcoded paths: ${commandsWithHardcoded.length}`, commandsWithHardcoded.length > 0 ? 'red' : 'green');

  if (commandsWithHardcoded.length > 0) {
    log('\n   ⚠️  Hardcoded paths found:', 'red');
    commandsWithHardcoded.forEach(cmd => {
      log(`      Block ${cmd.blockIndex}, Line ${cmd.lineIndex}: ${cmd.command}`, 'red');
    });
  }

  const passed = commandsWithSkillDir.length > 0 && commandsWithHardcoded.length === 0;
  testResult('All commands use $SKILL_DIR', passed);

  return { commandsWithSkillDir, commandsWithHardcoded };
}

// Test 3: Verify critical commands are present
function testCriticalCommands(pathCommands) {
  log('\n⚙️  Test 3: Critical Commands Presence', 'yellow');

  const criticalPatterns = [
    { name: 'Dev server detection', pattern: /detectDevServers/ },
    { name: 'Script execution (run.js)', pattern: /node run\.js/ },
    { name: 'Setup command', pattern: /npm run setup/ },
  ];

  let allFound = true;

  criticalPatterns.forEach(({ name, pattern }) => {
    const found = pathCommands.some(cmd => pattern.test(cmd.command));
    testResult(`${name} command exists`, found);
    allFound = allFound && found;
  });

  return allFound;
}

// Test 4: Syntax validation (dry-run)
async function testCommandSyntax(pathCommands, skillPath) {
  log('\n✓ Test 4: Command Syntax Validation', 'yellow');

  const commandsToTest = pathCommands
    .filter(cmd => cmd.hasSkillDir)
    .slice(0, 5); // Test first 5 commands as sample

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const cmd of commandsToTest) {
    const actualCommand = cmd.command.replace(/\$SKILL_DIR/g, skillPath);

    // SECURITY: Use validation utilities to check command safety
    const result = sanitizeCommand(cmd.command, skillPath);

    if (result.valid) {
      passed++;
      log(`   ✓ Valid: ${actualCommand.substring(0, 60)}...`, 'green');
    } else if (result.suspicious) {
      warnings++;
      failed++;
      log(`   ⚠️  Suspicious: ${actualCommand.substring(0, 60)}...`, 'yellow');
      log(`      Reason: ${result.reason}`, 'cyan');
    } else {
      failed++;
      log(`   ✗ Blocked: ${actualCommand.substring(0, 60)}...`, 'red');
      log(`      Reason: ${result.reason}`, 'cyan');
    }
  }

  const allPassed = failed === 0;
  const details = warnings > 0
    ? `Checked ${commandsToTest.length} commands, ${failed} failures, ${warnings} warnings`
    : `Checked ${passed} commands, ${failed} failures`;

  testResult('Command syntax validation', allPassed, details);

  return allPassed;
}

// Test 5: Verify no legacy patterns remain
function testNoLegacyPatterns(content) {
  log('\n🔍 Test 5: Legacy Pattern Detection', 'yellow');

  const legacyPatterns = [
    { name: 'Hardcoded ~/.claude/skills/playwright-skill in commands', pattern: /```[\s\S]*?cd ~\/\.claude\/skills\/playwright-skill(?![\s\S]*?\$SKILL_DIR)[\s\S]*?```/g },
    { name: 'Absolute paths without $SKILL_DIR', pattern: /cd \/.*\/\.claude\/skills\/playwright-skill(?!.*\$SKILL_DIR)/ },
  ];

  let foundLegacy = false;

  // Exclude the path resolution preamble from this check
  const preambleEnd = content.indexOf('# Playwright Browser Automation');
  const contentToCheck = content.substring(preambleEnd);

  legacyPatterns.forEach(({ name, pattern }) => {
    const matches = contentToCheck.match(pattern);
    const found = matches && matches.length > 0;

    if (found) {
      testResult(name, false, `Found ${matches.length} occurrence(s)`);
      foundLegacy = true;
    } else {
      testResult(name, true);
    }
  });

  return !foundLegacy;
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  Playwright Skill - Command Validation Test Suite', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Find the skill
  const installation = findPlaywrightSkill();
  if (!installation) {
    log('❌ Cannot find playwright-skill installation', 'red');
    process.exit(1);
  }

  log(`📍 Found skill at: ${installation.skillPath}`, 'cyan');

  const { skillMdPath, skillPath } = installation;

  // Test 1: Extract commands
  results.total++;
  const { content, codeBlocks, pathCommands } = testCommandExtraction(skillMdPath);
  if (codeBlocks.length > 0 && pathCommands.length > 0) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: $SKILL_DIR usage
  results.total++;
  const { commandsWithSkillDir, commandsWithHardcoded } = testSkillDirUsage(pathCommands);
  if (commandsWithSkillDir.length > 0 && commandsWithHardcoded.length === 0) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Critical commands
  results.total++;
  if (testCriticalCommands(pathCommands)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Syntax validation
  results.total++;
  if (await testCommandSyntax(pathCommands, skillPath)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: No legacy patterns
  results.total++;
  if (testNoLegacyPatterns(content)) {
    results.passed++;
  } else {
    results.failed++;
  }

  printSummary(results);

  process.exit(results.failed > 0 ? 1 : 0);
}

function printSummary(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('  Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(60) + '\n', 'blue');

  if (results.failed === 0) {
    log('🎉 All command tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'red');
  }
}

// Run the tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
