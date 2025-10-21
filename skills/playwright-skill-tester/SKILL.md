---
name: playwright-skill-tester
description: Comprehensive testing suite for validating the playwright-skill across all installation methods. Use this skill when verifying skill changes, testing installations, or validating that dynamic path resolution works correctly for plugin, manual global, and project-specific installations.
---

# Playwright Skill Tester

Automated testing suite for validating the playwright-skill implementation.

## Overview

This skill provides automated testing capabilities to verify the playwright-skill works correctly across all installation methods:
- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

The skill intelligently detects whether testing during development (local workspace) or validating a deployed installation.

## When to Use This Skill

Use this skill when:
- Testing changes to playwright-skill before publishing
- Validating a new installation of playwright-skill
- Verifying skill works after modifications to SKILL.md
- Creating test reports for skill validation
- Checking for hardcoded paths that should use `$SKILL_DIR`
- Debugging path-related issues in the playwright-skill

## Quick Start

Run comprehensive tests with automatic dependency setup:

```bash
cd /Users/bryanlackey/workspace/github.com/lackeyjb/playwright-skill/skills/playwright-skill-tester
node scripts/generate_test_report.js --setup
```

This command will:
1. Install npm dependencies in playwright-skill (if needed)
2. Run all three test suites automatically
3. Generate `TEST_REPORT.md` with results
4. Exit with code 0 (success) or 1 (failure)

**For tests without dependency setup**, omit the `--setup` flag. Some optional tests may fail if dependencies are missing.

## How It Works

### Smart Context Detection

The tester automatically detects its environment:

**Development Mode** (testing local changes):
- Detected when: Tester is in `repo/skills/playwright-skill-tester` with sibling `playwright-skill/`
- Tests: Only the local workspace version
- Use case: Iterating on changes before publishing

**Production Mode** (validating installations):
- Detected when: Tester is installed separately from playwright-skill
- Tests: All standard installation locations
- Use case: Verifying deployments work correctly

### Test Suites

The test report generator runs three test suites:

1. **Path Resolution Tests** (`scripts/test_path_resolution.js`)
   - Verifies SKILL.md contains path resolution instructions
   - Checks all installation methods are documented
   - Validates no hardcoded paths remain
   - Confirms $SKILL_DIR is used throughout

2. **Installation Methods Tests** (`scripts/test_installation_methods.sh`)
   - Tests file structure (SKILL.md, run.js, package.json)
   - Validates path resolution implementation
   - Distinguishes critical vs optional tests

3. **Command Validation Tests** (`scripts/test_commands.js`)
   - Extracts all commands from SKILL.md
   - Verifies commands use $SKILL_DIR
   - Validates syntax and structure

For detailed information about each test suite, including expected outputs and what each test validates, see `references/test_suites.md`.

### Generated Output

The test report generator creates:
- **TEST_REPORT.md** - Comprehensive test results in markdown format
- **Console output** - Real-time test execution with summary
- **Exit codes** - 0 for success, 1 for failure (CI/CD compatible)

## Typical Workflow

### Testing Skill Changes

When working on playwright-skill and validating changes:

```bash
# 1. Make changes to playwright-skill/SKILL.md
# 2. Run tests with dependency setup
cd skills/playwright-skill-tester
node scripts/generate_test_report.js --setup

# 3. Review results
cat TEST_REPORT.md

# 4. Fix any issues and re-test
```

### Validating Before Publishing

Before publishing a new version of playwright-skill:

```bash
# Run comprehensive tests
cd skills/playwright-skill-tester
node scripts/generate_test_report.js --setup

# Verify all tests pass (100% success rate)
cat TEST_REPORT.md

# Package and publish if tests pass
```

### Debugging Installation Issues

When a user reports playwright-skill doesn't work:

```bash
# Install testing skill on their machine
cp -r playwright-skill-tester ~/.claude/skills/

# Run tests to diagnose
cd ~/.claude/skills/playwright-skill-tester
node scripts/generate_test_report.js

# Review which tests fail to identify the issue
```

## Running Individual Test Suites

For focused debugging, run individual test suites:

```bash
# Path resolution tests
node scripts/test_path_resolution.js

# Installation methods tests
bash scripts/test_installation_methods.sh

# Command validation tests
node scripts/test_commands.js
```

## Dependency Management

The playwright-skill requires npm dependencies (Playwright, etc.) to function properly.

**Automatic Setup:**
Use the `--setup` flag to automatically install dependencies before testing:
```bash
node scripts/generate_test_report.js --setup
```

**Manual Setup:**
Install dependencies separately:
```bash
node scripts/setup_dependencies.js
```

**When to use --setup:**
- First time testing a fresh clone
- Testing after pulling latest changes that update dependencies
- When "Dev server detection" test failures occur
- To ensure 100% test success rate (18/18 tests passing)

## Success Criteria

Changes are ready when:

✅ **All automated tests pass:**
- Path resolution tests: 100%
- Installation methods tests: 100%
- Command validation tests: 100%

✅ **Manual verification complete:**
- Tested with real Claude instance
- No trial-and-error observed
- Commands execute without path errors

✅ **Documentation quality:**
- Path resolution instructions are clear
- All installation methods documented
- $SKILL_DIR used consistently

## Integration with skill-creator

This testing skill follows the skill-creator workflow (Step 6: Iterate):

1. **Test** - Use this skill to validate playwright-skill
2. **Notice** - Identify issues or inefficiencies
3. **Iterate** - Update playwright-skill SKILL.md
4. **Re-test** - Run tests again to verify fixes

This completes the skill development lifecycle, ensuring the playwright-skill works correctly before distribution.

## Reference Documentation

For detailed information, consult these reference documents:

- **`references/test_suites.md`** - Detailed documentation for each test suite, including expected outputs and what each test validates

- **`references/troubleshooting.md`** - Comprehensive troubleshooting guide for common failure scenarios, exit codes, and how to interpret test results

- **`references/test_matrix.md`** - Complete test checklist for manual testing procedures, edge cases, and comprehensive test coverage

- **`USAGE.md`** - Guide for using this testing skill in other Claude Code instances, including installation methods and sharing with other developers

## Tips

- Use `--setup` flag for 100% pass rate (18/18 tests)
- Run `generate_test_report.js` first - it runs all tests automatically
- Individual test scripts can be run for focused debugging
- Test reports include actionable next steps
- Exit codes allow for automation and CI/CD integration
- Tests are non-destructive and safe to run repeatedly
- Scripts automatically detect installation location
- Dependencies only need to be installed once

---

*This testing skill was created using the skill-creator workflow and validates the playwright-skill implementation*
