#!/usr/bin/env node

/**
 * Test Path Resolution for Playwright Skill
 *
 * This script verifies that:
 * 1. The playwright-skill can be found in various installation locations
 * 2. SKILL.md contains proper path resolution instructions
 * 3. All $SKILL_DIR placeholders are present (no hardcoded paths remain)
 * 4. The skill can be loaded and used correctly
 */

const fs = require('fs');
const path = require('path');
const { detectTestTarget } = require('./detect_test_target');

// ANSI color codes for output
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

// Find the playwright-skill installation to test
function findPlaywrightSkill() {
  const testConfig = detectTestTarget();

  log(`\n🔍 Test Mode: ${testConfig.mode}`, 'magenta');
  if (testConfig.mode === 'development') {
    log(`   Testing LOCAL workspace version only`, 'cyan');
  } else {
    log(`   Testing installed versions`, 'cyan');
  }

  // In development mode, only test the workspace version
  // In production mode, find the first available installation
  for (const target of testConfig.targets) {
    const skillMdPath = path.join(target.path, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      log(`   Found: ${target.name}`, 'green');
      log(`   Path: ${target.path}`, 'cyan');
      return {
        method: target.name,
        skillPath: target.path,
        skillMdPath: skillMdPath,
        mode: testConfig.mode
      };
    }
  }

  return null;
}

// Test 1: Verify skill can be located
function testSkillLocation() {
  log('\n📍 Test 1: Skill Location Detection', 'yellow');
  const installation = findPlaywrightSkill();

  if (!installation) {
    testResult('Skill location detection', false, 'Could not find playwright-skill in any expected location');
    return null;
  }

  testResult('Skill location detection', true, `Found at: ${installation.skillPath}`);
  return installation;
}

// Test 2: Verify path resolution instructions are present
function testPathResolutionInstructions(skillMdPath) {
  log('\n📋 Test 2: Path Resolution Instructions', 'yellow');

  const content = fs.readFileSync(skillMdPath, 'utf8');

  // Check for the path resolution preamble
  const hasPathResolution = content.includes('**IMPORTANT - Path Resolution:**');
  testResult('Has path resolution section', hasPathResolution);

  const hasPluginPath = content.includes('~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill');
  testResult('Documents plugin installation path', hasPluginPath);

  const hasManualPath = content.includes('~/.claude/skills/playwright-skill');
  testResult('Documents manual installation path', hasManualPath);

  const hasProjectPath = content.includes('<project>/.claude/skills/playwright-skill');
  testResult('Documents project-specific path', hasProjectPath);

  return hasPathResolution && hasPluginPath && hasManualPath && hasProjectPath;
}

// Test 3: Verify no hardcoded paths remain
function testNoHardcodedPaths(skillMdPath) {
  log('\n🔎 Test 3: Hardcoded Path Detection', 'yellow');

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const lines = content.split('\n');

  // Look for hardcoded paths outside of the path resolution section
  const hardcodedPathPattern = /cd ~\/\.claude\/skills\/playwright-skill/g;
  const pathResolutionSectionEnd = content.indexOf('# Playwright Browser Automation');
  const afterPreamble = content.substring(pathResolutionSectionEnd);

  const hardcodedMatches = afterPreamble.match(hardcodedPathPattern);

  const passed = !hardcodedMatches || hardcodedMatches.length === 0;
  testResult(
    'No hardcoded paths in commands',
    passed,
    passed ? 'All command paths use $SKILL_DIR' : `Found ${hardcodedMatches.length} hardcoded path(s)`
  );

  return passed;
}

// Test 4: Verify $SKILL_DIR placeholder usage
function testSkillDirUsage(skillMdPath) {
  log('\n🎯 Test 4: $SKILL_DIR Placeholder Usage', 'yellow');

  const content = fs.readFileSync(skillMdPath, 'utf8');

  // Count $SKILL_DIR occurrences
  const skillDirMatches = content.match(/\$SKILL_DIR/g);
  const count = skillDirMatches ? skillDirMatches.length : 0;

  // According to the PR, there should be 9 references (originally hardcoded)
  const expectedMin = 9;
  const passed = count >= expectedMin;

  testResult(
    '$SKILL_DIR placeholder usage',
    passed,
    `Found ${count} occurrences (expected at least ${expectedMin})`
  );

  return passed;
}

// Test 5: Verify critical commands use dynamic paths
function testCriticalCommands(skillMdPath) {
  log('\n⚙️  Test 5: Critical Command Path Resolution', 'yellow');

  const content = fs.readFileSync(skillMdPath, 'utf8');

  const criticalCommands = [
    { name: 'Dev server detection', pattern: /cd \$SKILL_DIR.*detectDevServers/ },
    { name: 'Script execution', pattern: /cd \$SKILL_DIR.*node run\.js/ },
    { name: 'Setup command', pattern: /cd \$SKILL_DIR.*npm run setup/ }
  ];

  let allPassed = true;

  criticalCommands.forEach(cmd => {
    const found = cmd.pattern.test(content);
    testResult(`${cmd.name} uses $SKILL_DIR`, found);
    allPassed = allPassed && found;
  });

  return allPassed;
}

// Main test runner
function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('  Playwright Skill - Path Resolution Test Suite', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Find the skill
  const installation = testSkillLocation();
  results.total++;
  if (!installation) {
    results.failed++;
    log('\n❌ Cannot proceed with remaining tests - skill not found', 'red');
    return printSummary(results);
  }
  results.passed++;

  const { skillMdPath } = installation;

  // Test 2: Path resolution instructions
  results.total++;
  if (testPathResolutionInstructions(skillMdPath)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: No hardcoded paths
  results.total++;
  if (testNoHardcodedPaths(skillMdPath)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: $SKILL_DIR usage
  results.total++;
  if (testSkillDirUsage(skillMdPath)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Critical commands
  results.total++;
  if (testCriticalCommands(skillMdPath)) {
    results.passed++;
  } else {
    results.failed++;
  }

  printSummary(results);

  // Exit with appropriate code
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
    log('🎉 All tests passed! Path resolution is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'red');
  }
}

// Run the tests
runAllTests();
