#!/usr/bin/env node

/**
 * Generate Test Report for Playwright Skill
 *
 * This script:
 * 1. Runs all test scripts
 * 2. Aggregates results
 * 3. Generates a comprehensive markdown test report
 * 4. Optionally updates MANUAL_TEST.md with results
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test suite configuration
const testSuites = [
  {
    name: 'Path Resolution Tests',
    script: 'test_path_resolution.js',
    description: 'Validates dynamic path resolution functionality'
  },
  {
    name: 'Installation Methods Tests',
    script: 'test_installation_methods.sh',
    description: 'Tests all three installation methods'
  },
  {
    name: 'Command Validation Tests',
    script: 'test_commands.js',
    description: 'Validates all commands use $SKILL_DIR correctly'
  }
];

// Run a single test suite
async function runTestSuite(suite, scriptsDir, testerSkillDir) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`Running: ${suite.name}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');

  const scriptPath = path.join(scriptsDir, suite.script);

  try {
    const startTime = Date.now();

    // Determine the interpreter based on file extension
    const interpreter = suite.script.endsWith('.sh') ? 'bash' : 'node';

    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      const result = await execPromise(`${interpreter} "${scriptPath}"`, {
        cwd: testerSkillDir,  // Run from skill root, not scripts dir
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      // Non-zero exit code
      exitCode = error.code || 1;
      stdout = error.stdout || '';
      stderr = error.stderr || '';
    }

    const duration = Date.now() - startTime;

    // Parse output for pass/fail counts
    const output = stdout + stderr;
    const passMatch = output.match(/Passed:\s*(\d+)/i);
    const failMatch = output.match(/Failed:\s*(\d+)/i);
    const totalMatch = output.match(/Total.*:\s*(\d+)/i);

    return {
      name: suite.name,
      description: suite.description,
      passed: exitCode === 0,  // Use exit code to determine pass/fail
      output: output,
      stats: {
        total: totalMatch ? parseInt(totalMatch[1]) : 0,
        passed: passMatch ? parseInt(passMatch[1]) : 0,
        failed: failMatch ? parseInt(failMatch[1]) : 0
      },
      duration: duration,
      exitCode: exitCode
    };
  } catch (error) {
    return {
      name: suite.name,
      description: suite.description,
      passed: false,
      output: error.message,
      stats: { total: 0, passed: 0, failed: 1 },
      duration: 0,
      error: error.message
    };
  }
}

// Generate markdown report
function generateMarkdownReport(results, timestamp) {
  const overallPassed = results.every(r => r.passed);
  const totalTests = results.reduce((sum, r) => sum + r.stats.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.stats.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.stats.failed, 0);

  let report = `# Playwright Skill - Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `**Overall Status:** ${overallPassed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Test Suites | ${results.length} |\n`;
  report += `| Passed Suites | ${results.filter(r => r.passed).length} |\n`;
  report += `| Failed Suites | ${results.filter(r => !r.passed).length} |\n`;
  report += `| Total Tests | ${totalTests} |\n`;
  report += `| Passed Tests | ${totalPassed} |\n`;
  report += `| Failed Tests | ${totalFailed} |\n`;
  report += `| Success Rate | ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}% |\n\n`;

  report += `## Test Suites\n\n`;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    report += `### ${result.name} - ${status}\n\n`;
    report += `${result.description}\n\n`;

    if (result.stats.total > 0) {
      report += `- **Total Tests:** ${result.stats.total}\n`;
      report += `- **Passed:** ${result.stats.passed}\n`;
      report += `- **Failed:** ${result.stats.failed}\n`;
      report += `- **Duration:** ${result.duration}ms\n\n`;
    }

    if (result.error) {
      report += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }
  });

  report += `## Validation Checklist\n\n`;
  report += `- [${overallPassed ? 'x' : ' '}] All test suites passed\n`;
  report += `- [${totalFailed === 0 ? 'x' : ' '}] No test failures\n`;
  report += `- [ ] Plugin installation tested manually\n`;
  report += `- [ ] Manual global installation tested manually\n`;
  report += `- [ ] Project-specific installation tested manually\n`;
  report += `- [ ] Claude can correctly resolve $SKILL_DIR placeholder\n`;
  report += `- [ ] All commands execute without path errors\n\n`;

  report += `## Next Steps\n\n`;

  if (overallPassed) {
    report += `✅ All automated tests passed!\n\n`;
    report += `**Manual verification recommended:**\n`;
    report += `1. Test with a real Claude instance using the playwright-skill\n`;
    report += `2. Verify Claude can determine the correct installation path\n`;
    report += `3. Verify commands execute without trial-and-error\n`;
    report += `4. Test with at least one installation method manually\n\n`;
  } else {
    report += `❌ Some tests failed. Please review the failures above and fix issues before proceeding.\n\n`;
  }

  report += `---\n\n`;
  report += `*This report was automatically generated by the playwright-skill-tester*\n`;

  return report;
}

// Main function
async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('  Playwright Skill - Test Report Generator', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  // Find the tester skill directory
  const scriptsDir = __dirname;
  const testerSkillDir = path.dirname(scriptsDir);

  log(`📁 Tester skill directory: ${testerSkillDir}`, 'cyan');

  // Check if --setup flag is provided
  const shouldSetup = process.argv.includes('--setup') || process.argv.includes('--install-deps');

  if (shouldSetup) {
    log('\n🔧 Running dependency setup...', 'blue');
    try {
      const setupScript = path.join(scriptsDir, 'setup_dependencies.js');
      const { stdout, stderr } = await execPromise(`node "${setupScript}"`, {
        cwd: testerSkillDir,
        maxBuffer: 1024 * 1024 * 10
      });

      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }

      log('✅ Dependencies setup complete\n', 'green');
    } catch (error) {
      log('⚠️  Dependency setup failed, continuing with tests...', 'yellow');
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
    }
  }

  // Run all test suites
  const results = [];

  for (const suite of testSuites) {
    const result = await runTestSuite(suite, scriptsDir, testerSkillDir);
    results.push(result);
  }

  // Generate report
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const report = generateMarkdownReport(results, timestamp);

  // Save report
  const reportPath = path.join(testerSkillDir, 'TEST_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf8');

  log(`\n✅ Test report generated: ${reportPath}`, 'green');

  // Option to update MANUAL_TEST.md if it exists
  const playwrightSkillDir = path.dirname(testerSkillDir);
  const manualTestPath = path.join(path.dirname(playwrightSkillDir), 'MANUAL_TEST.md');

  if (fs.existsSync(manualTestPath)) {
    log(`\n📝 Found MANUAL_TEST.md, appending results...`, 'cyan');

    const manualTestContent = fs.readFileSync(manualTestPath, 'utf8');
    const separator = '\n\n---\n\n';
    const updatedContent = manualTestContent + separator + `## Automated Test Results\n\n` + report;

    fs.writeFileSync(manualTestPath, updatedContent, 'utf8');
    log(`✅ Updated: ${manualTestPath}`, 'green');
  }

  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('  Summary', 'blue');
  log('='.repeat(60), 'blue');

  const overallPassed = results.every(r => r.passed);
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;

  log(`Test Suites: ${results.length}`, 'cyan');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');

  if (overallPassed) {
    log('\n🎉 All test suites passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some test suites failed.', 'red');
    process.exit(1);
  }
}

// Run the generator
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
